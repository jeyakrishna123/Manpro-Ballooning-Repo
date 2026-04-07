import io
import re
import time
import logging
from typing import List, Tuple

import cv2
import numpy as np
from PIL import Image
from paddleocr import PaddleOCR

from models import OcrWordResult

logger = logging.getLogger("ocr_engine")

# Engineering symbol corrections: common OCR misreads for technical drawings
SYMBOL_CORRECTIONS = [
    # Dollar sign → diameter symbol (most common GD&T misread)
    (re.compile(r'\$\s*(\d)'), r'Ø\1'),
    (re.compile(r'\$\s*(\.\d)'), r'Ø\1'),
    # O/o at START of text before digits → diameter symbol (Ø)
    # Only match at word boundary start — NOT mid-text like "BOX" or "0.08"
    (re.compile(r'^O(?=\d+\.\d)'), 'Ø'),
    (re.compile(r'^o(?=\d+\.\d)'), 'Ø'),
    # Tolerance symbols
    (re.compile(r'\+/-'), '±'),
    (re.compile(r'\+-'), '±'),
    (re.compile(r'\+/\s*-'), '±'),
    # Colon misread as period in dimensions: 4.490+:003 → 4.490+.003
    (re.compile(r'(\d)\+:(\d)'), r'\1+.\2'),
    (re.compile(r'(\d)-:(\d)'), r'\1-.\2'),
    # Degree symbol — only at end of text (avoid mid-text corruption)
    (re.compile(r'(\d)\s*[oO]\s*$'), r'\1°'),
    # Common angle misreads: 459→45°, 450→45°, 309→30°, 900→90° etc.
    (re.compile(r'^(45)[90oO]$'), r'\1°'),
    (re.compile(r'^(30)[90oO]$'), r'\1°'),
    (re.compile(r'^(90)[90oO]$'), r'\1°'),
    (re.compile(r'^(60)[90oO]$'), r'\1°'),
    (re.compile(r'^(15)[90oO]$'), r'\1°'),
    (re.compile(r'^(10)[90oO]$'), r'\1°'),
    (re.compile(r'^(25)[90oO]$'), r'\1°'),
    (re.compile(r'^(20)[90oO]$'), r'\1°'),
    (re.compile(r'^(70)[90oO]$'), r'\1°'),
    (re.compile(r'^(50)[90oO]$'), r'\1°'),
    # Duplicate angle reads: "459 450" → "45°"
    (re.compile(r'^(45|30|90|60|15|10|25|20)[90oO]\s+(45|30|90|60|15|10|25|20)[90oO]$'), r'\1°'),
    # l/1 confusion (only between digits)
    (re.compile(r'(?<=\d)l(?=\d)'), '1'),
    # Clean up "t" misread as tolerance symbol
    (re.compile(r'(\d)t\s'), r'\1± '),
    # Surface finish
    (re.compile(r'Ra\s*(\d)'), r'Ra \1'),
    (re.compile(r'Rz\s*(\d)'), r'Rz \1'),
]

ENGINEERING_PATTERNS = [
    re.compile(r'^\d+\.?\d*$'),                          # Plain numbers: 25.12, 3
    re.compile(r'^\d+\.?\d*\s*[±]\s*\d+\.?\d*$'),       # Tolerances: 3.92±0.02
    re.compile(r'^[ØR]\d+\.?\d*$'),                      # Diameter/Radius: Ø0.36, R0.8
    re.compile(r'^M\d+'),                                 # Thread: M6, M12x1.5
    re.compile(r'^\d+/\d+-\d+'),                         # Thread: 1/4-20
    re.compile(r'^\d+[°]'),                               # Angles: 45°, 90°
    re.compile(r'^[A-Z]{1,3}$'),                         # Datum refs: A, B, AB
    re.compile(r'^\d+×\d+'),                              # Multiplied dims
    re.compile(r'^Ra\s*\d'),                              # Surface finish Ra
    re.compile(r'^Rz\s*\d'),                              # Surface finish Rz
    re.compile(r'^\d+\.\d{1,4}$'),                       # Decimal dimensions
    re.compile(r'^\.\d{1,4}$'),                           # Leading-dot decimals: .005
    re.compile(r'^\d+\.\d+[±]\d'),                       # Dim with tolerance
    re.compile(r'^[+-]?\.\d+$'),                          # Signed decimals: -.005, +.003
    re.compile(r'^\d+[xX]\s'),                            # Count prefix: 4X, 8X
    re.compile(r'^THRU$', re.IGNORECASE),                 # Hole callout
    re.compile(r'^DETAIL\s+[A-Z]', re.IGNORECASE),       # Detail views
    re.compile(r'^SECTION\s+[A-Z]', re.IGNORECASE),      # Section views
    re.compile(r'^SCALE\s+\d', re.IGNORECASE),           # Scale callout
    re.compile(r'^VIEW\s+[A-Z]', re.IGNORECASE),         # View labels
    re.compile(r'^UNC|UNF|UNS', re.IGNORECASE),          # Thread standards
    re.compile(r'^CLASS\s+\d', re.IGNORECASE),            # Pressure class
    re.compile(r'^NPS\s+\d', re.IGNORECASE),             # Pipe size
    re.compile(r'^\d+\.\d+\s*[+-]\s*\.\d+'),            # Dim with +/- tol: 4.490+.003
    re.compile(r'^Ø\d+\.?\d*'),                          # Diameter with Ø symbol
    re.compile(r'^\d+\.\d+\s*-\s*\d+\.\d+'),            # Dimension range: 527.30 - 527.81
    re.compile(r'^\d+°$'),                                # Angle with degree
]

# ── Garbage / noise detection ──────────────────────────────────────────
# Patterns that indicate OCR garbage (misread drawing lines, GD&T frames, etc.)
GARBAGE_PATTERNS = [
    # Repeated identical letters (3+): "eeeee", "nnnn", "aaaa" — garbled text
    re.compile(r'(.)\1{2,}'),
    # Mostly non-alphanumeric junk: "o0E-o0", "8-S9z", "(68E"
    re.compile(r'^[^a-zA-Z0-9ØøÆæ°±×µ]{2,}$'),
    # GD&T frame symbols misread: single "&", "Q" (from Ø), lone punctuation
    re.compile(r'^[&@#%^~`\\|]+$'),
    # Strings that are almost entirely the same character repeated
    re.compile(r'^(.)\1+.?\1*$'),
    # Mixed garbage: short strings with no vowels and no digits (likely noise)
    # e.g. "8-S9z", "(68E", "U< >Y", "V<>W"
    re.compile(r'^[^aeiouAEIOU\d]{1,3}[<>\[\]{}()|]{1,}[^aeiouAEIOU\d]{0,3}$'),
]

    # Common English words found in engineering drawings (for garbled text detection)
_COMMON_ENG_WORDS = {
    'the', 'and', 'for', 'not', 'are', 'but', 'all', 'can', 'had', 'her',
    'was', 'one', 'our', 'out', 'has', 'with', 'this', 'that', 'from',
    'they', 'been', 'have', 'said', 'each', 'will', 'must', 'shall',
    'note', 'see', 'per', 'max', 'min', 'typ', 'ref', 'nom', 'dim',
    'thru', 'drill', 'thread', 'scale', 'view', 'detail', 'section',
    'class', 'seat', 'break', 'sharp', 'edges', 'permitted', 'unless',
    'otherwise', 'specified', 'surface', 'finish', 'remove', 'burrs',
    'tolerance', 'drawing', 'material', 'revision', 'date', 'name',
    'type', 'size', 'valve', 'plug', 'stem', 'ring', 'seal', 'port',
    'travel', 'design', 'unit', 'measure', 'millimeters', 'inches',
    'sheet', 'scale', 'ecrn', 'supersedes', 'controls', 'fisher',
    'emerson', 'confidential', 'document', 'program', 'property',
    'additional', 'machining', 'required', 'handle', 'pack', 'make',
    'corners', 'chamfer', 'radius', 'inspect', 'verify', 'critical',
    'inspection', 'imperfect', 'lead', 'double', 'coat', 'after',
    'except', 'anti', 'extrusion', 'order', 'cust', 'spcl', 'balanced',
    'retaining', 'project', 'length', 'full', 'depth', 'asme',
}

def _is_known_english(word: str) -> bool:
    """Check if a word looks like real English (for drawings)."""
    w = word.lower().strip('.,;:!?()[]')
    if w in _COMMON_ENG_WORDS:
        return True
    if len(w) >= 4 and w.isalpha():
        # Basic consonant/vowel ratio check — real English words
        # have vowels. Pure consonant strings are likely garbage.
        vowels = sum(1 for c in w if c in 'aeiou')
        if vowels == 0:
            return False  # No vowels = not English
        ratio = vowels / len(w)
        if 0.15 <= ratio <= 0.75:
            return True
    return False


def _is_garbage_text(text: str) -> bool:
    """Detect OCR garbage text that should never become a balloon."""
    if not text or len(text) == 0:
        return True

    stripped = text.strip()
    if len(stripped) == 0:
        return True

    # ── Contains replacement character (Ø) — garbled encoding ──
    if '\ufffd' in stripped or '�' in stripped:
        return True

    # ── Quick-pass: pure numeric/engineering text ──
    if re.match(r'^[\d.±+\-/xX°ØR ]+$', stripped) and len(stripped) <= 20:
        return False
    if re.match(r'^(THRU|DRILL|THREAD|SCALE|VIEW|DETAIL|SECTION|CLASS|SEAT|NOTE|MAX|MIN|TYP|REF|NOM|BASIC|BREAK|SHARP|EDGES|PERMITTED)$', stripped, re.IGNORECASE):
        return False

    # ── Check explicit garbage patterns ──
    for pat in GARBAGE_PATTERNS:
        if pat.search(stripped):
            if re.match(r'^[\d.±+\-/xX°ØR ]+$', stripped):
                return False
            return True

    # ── "Q" as Ø misread ──
    if stripped == 'Q':
        return True

    # ── Bracket/angle bracket noise: "U< >Y", "V<>W" ──
    if re.search(r'[<>\[\]{}]', stripped):
        return True

    # ── Short mixed alpha+digit noise (2-5 chars): "6E", "A0", "(68E", "8-S9z" ──
    if 2 <= len(stripped) <= 5:
        has_digit = any(c.isdigit() for c in stripped)
        has_alpha = any(c.isalpha() for c in stripped)

        if has_digit and has_alpha:
            # Allow known engineering patterns
            if re.match(r'^\d+[xX]$', stripped):         # 4X, 8X
                return False
            if re.match(r'^[RØMø]\d', stripped):          # R0.8, M6, Ø0.36
                return False
            if re.match(r'^\d+[°]$', stripped):           # 45°, 90°
                return False
            if re.match(r'^\d+/\d+', stripped):           # 1/4
                return False
            if re.match(r'^[A-Z]\d+$', stripped):         # A1 (but only high-confidence, handled elsewhere)
                return True  # Short letter+digit combos are usually GD&T noise
            # Everything else: "(68E", "6E", "8-S9z" etc. → garbage
            return True

    # ── Garbled GD&T text with trailing alpha noise: "Ø0.13OBAO", "P 1.52MAM)" ��─
    # Dimension followed by random uppercase letters
    if re.search(r'\d[A-Z]{2,}[)]*$', stripped):
        # Exception: known suffixes like "MAX", "MIN", "TYP", "REF", "NOM", "THRU"
        suffix_match = re.search(r'[A-Z]{2,}[)]*$', stripped)
        if suffix_match:
            suffix = suffix_match.group().rstrip(')')
            if suffix not in ('MAX', 'MIN', 'TYP', 'REF', 'NOM', 'THRU', 'UNC', 'UNF', 'UNS', 'BA', 'RA'):
                return True

    # ── Leading lowercase letter before dimension: "g 6.38-6.45" ──
    if re.match(r'^[a-z]\s+\d', stripped):
        return True

    # ── Trailing lowercase noise after count prefix: "4X p" ──
    if re.match(r'^\d+[xX]\s+[a-z]$', stripped):
        return True

    # ── Detect garbled text: words that don't look like English ──
    if len(stripped) > 8:
        tokens = stripped.split()
        if tokens and len(tokens) >= 2:
            known = sum(1 for t in tokens if _is_known_english(t) or re.match(r'^[\d.±+\-/°Ø]+$', t))
            ratio = known / len(tokens)
            # If less than 35% of tokens are recognizable, it's garbage
            if ratio < 0.35:
                return True

    # ── Single character filter ──
    if len(stripped) == 1:
        if not stripped.isalnum() and stripped not in 'ØøRر°×':
            return True

    return False

# Thresholds (pixels)
LARGE_PIXELS = 3000 * 3000    # >9MP: single pass
MEDIUM_PIXELS = 1500 * 1500   # 2.25-9MP: smart single pass + conditional second
SMALL_PIXELS = 800 * 800      # <0.64MP: upscale + enhanced detection

# Minimum expected words for a drawing of a given size
# If first pass returns fewer, trigger a rescue pass
MIN_WORDS_LARGE = 15
MIN_WORDS_MEDIUM = 8
MIN_WORDS_SMALL = 3


class PaddleOcrEngine:
    def __init__(self, use_gpu: bool = False):
        # Primary engine: balanced detection for engineering drawings
        # Lower det_db_box_thresh (0.35 from 0.45) to catch small annotations
        # Lower drop_score (0.15 from 0.25) to preserve borderline text
        self.ocr = PaddleOCR(
            use_angle_cls=True, lang="en", show_log=False, use_gpu=use_gpu,
            ocr_version="PP-OCRv4",
            det_db_thresh=0.20, det_db_box_thresh=0.35,
            det_db_unclip_ratio=2.0, det_limit_side_len=2560,
            rec_batch_num=32, drop_score=0.15, cls_batch_num=32,
        )
        # High-sensitivity engine: for rescue passes on small/missed text
        # Reuses same model weights (PaddleOCR caches internally)
        self.ocr_sensitive = PaddleOCR(
            use_angle_cls=True, lang="en", show_log=False, use_gpu=use_gpu,
            ocr_version="PP-OCRv4",
            det_db_thresh=0.12, det_db_box_thresh=0.25,
            det_db_unclip_ratio=2.5, det_limit_side_len=3840,
            rec_batch_num=32, drop_score=0.10, cls_batch_num=32,
        )
        # Fast engine: for /ocr/fast endpoint only
        self.ocr_fast = PaddleOCR(
            use_angle_cls=False, lang="en", show_log=False, use_gpu=use_gpu,
            ocr_version="PP-OCRv4",
            det_db_thresh=0.25, det_db_box_thresh=0.45,
            det_db_unclip_ratio=1.8, det_limit_side_len=960,
            rec_batch_num=32, drop_score=0.20, cls_batch_num=32,
        )

    def _to_gray(self, img: np.ndarray) -> np.ndarray:
        if len(img.shape) == 3 and img.shape[2] == 3:
            return cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        elif len(img.shape) == 3 and img.shape[2] == 4:
            return cv2.cvtColor(img, cv2.COLOR_RGBA2GRAY)
        return img.copy()

    def _preprocess(self, img: np.ndarray) -> np.ndarray:
        """Fast preprocessing: CLAHE + sharpen + Otsu. No slow denoising."""
        gray = self._to_gray(img)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)
        _, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_close)
        return cv2.cvtColor(cleaned, cv2.COLOR_GRAY2RGB)

    def _preprocess_adaptive(self, img: np.ndarray) -> np.ndarray:
        """Adaptive threshold preprocessing for rescue passes on small text.
        Uses bilateral filter (much faster than fastNlMeansDenoising) + adaptive threshold."""
        gray = self._to_gray(img)
        # Bilateral filter: preserves edges while smoothing noise (~10x faster than NLMeans)
        denoised = cv2.bilateralFilter(gray, d=7, sigmaColor=50, sigmaSpace=50)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)
        kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)
        binary = cv2.adaptiveThreshold(
            sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, blockSize=15, C=8
        )
        kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_close)
        return cv2.cvtColor(cleaned, cv2.COLOR_GRAY2RGB)

    def _upscale(self, img: np.ndarray, scale: float) -> np.ndarray:
        h, w = img.shape[:2]
        return cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_LANCZOS4)

    def _ocr_pass(self, img: np.ndarray, engine=None) -> List[dict]:
        if engine is None:
            engine = self.ocr
        try:
            results = engine.ocr(img, cls=engine != self.ocr_fast)
            return self._extract_results(results)
        except Exception as e:
            logger.error(f"OCR pass failed: {e}")
            return []

    def _merge(self, primary: List[dict], secondary: List[dict]) -> List[dict]:
        if not secondary:
            return primary
        if not primary:
            return secondary
        merged = [dict(item) for item in primary]
        for sec in secondary:
            sx, sy, sw, sh = sec["x"], sec["y"], sec["w"], sec["h"]
            sa = sw * sh
            if sa == 0:
                continue
            dup = False
            for i, pri in enumerate(merged):
                px, py, pw, ph = pri["x"], pri["y"], pri["w"], pri["h"]
                ox = max(0, min(px + pw, sx + sw) - max(px, sx))
                oy = max(0, min(py + ph, sy + sh) - max(py, sy))
                oa = ox * oy
                pa = pw * ph
                if pa > 0 and oa / min(sa, pa) > 0.4:
                    if sec["confidence"] > pri["confidence"]:
                        merged[i] = dict(sec)
                    dup = True
                    break
            if not dup:
                merged.append(dict(sec))
        return merged

    def _postprocess(self, merged: List[dict]) -> List[OcrWordResult]:
        words = []
        for item in merged:
            text = item["text"].strip()
            if not text:
                continue

            # ── Step 1: Apply symbol corrections ──
            for pat, repl in SYMBOL_CORRECTIONS:
                if repl is not None:
                    text = pat.sub(repl, text)

            # ── Step 2: Garbage detection (before confidence boost) ──
            if _is_garbage_text(text):
                continue

            conf = item["confidence"]

            # ── Step 3: Confidence boost for engineering patterns ──
            is_engineering = False
            for pat in ENGINEERING_PATTERNS:
                if pat.match(text.strip()):
                    conf = min(1.0, conf + 0.1)
                    is_engineering = True
                    break

            # ── Step 4: Strict confidence thresholds ──
            # Base threshold: 55% — eliminates most garbage
            min_conf = 0.55

            # Single characters need very high confidence (often OCR artifacts)
            if len(text) == 1:
                if text.isdigit():
                    min_conf = 0.80  # Single digits: very high (often border/line noise)
                elif text.isalpha() and text.isupper():
                    # Single uppercase letters: datum references need high confidence
                    # to distinguish from noise (stray marks, line intersections)
                    min_conf = 0.75
                else:
                    min_conf = 0.85

            # 2 char text: higher threshold (lots of noise at this length)
            elif len(text) == 2:
                if is_engineering or re.match(r'^[ØR±°]', text):
                    min_conf = 0.50
                else:
                    min_conf = 0.65

            # 3 char text
            elif len(text) == 3:
                if is_engineering or re.match(r'^[ØR±°]', text):
                    min_conf = 0.50
                else:
                    min_conf = 0.60

            # Short non-engineering text (4-10 chars): standard threshold
            elif len(text) <= 10 and not is_engineering:
                min_conf = 0.55

            # Long text (likely labels/notes)
            elif len(text) > 10:
                min_conf = 0.50

            if conf < min_conf:
                continue

            # ── Step 5: Additional noise filters ──
            # Filter lone punctuation/symbols that aren't engineering symbols
            if len(text) <= 2 and re.match(r'^[.,:;!?\'"()\[\]{}<>]+$', text):
                continue

            # Filter text that's mostly special chars (likely GD&T frame misread)
            if len(text) >= 2:
                alpha_num = sum(1 for c in text if c.isalnum() or c in 'Øø°±×.')
                if alpha_num / len(text) < 0.40:
                    continue

            words.append(OcrWordResult(
                text=text, x=max(0, item["x"]), y=max(0, item["y"]),
                width=max(1, item["w"]), height=max(1, item["h"]),
                confidence=round(conf, 4),
            ))
        return words

    def process_image_fast(self, image_bytes: bytes) -> Tuple[List[OcrWordResult], int, int]:
        """Fast single-pass OCR for speed. Trades some accuracy for ~5x speed."""
        if not image_bytes or len(image_bytes) == 0:
            raise ValueError("Empty image data received")

        image = Image.open(io.BytesIO(image_bytes))
        if image.mode == "RGBA":
            bg = Image.new("RGB", image.size, (255, 255, 255))
            bg.paste(image, mask=image.split()[3])
            image = bg
        elif image.mode != "RGB":
            image = image.convert("RGB")

        img = np.array(image)
        h, w = img.shape[:2]
        if w <= 0 or h <= 0:
            raise ValueError(f"Invalid image dimensions: {w}x{h}")

        # Single pass with fast engine, no preprocessing
        merged = self._ocr_pass(img, engine=self.ocr_fast)

        return self._postprocess(merged), w, h

    def process_image(self, image_bytes: bytes) -> Tuple[List[OcrWordResult], int, int]:
        t0 = time.time()
        if not image_bytes or len(image_bytes) == 0:
            raise ValueError("Empty image data received")

        image = Image.open(io.BytesIO(image_bytes))
        if image.mode == "RGBA":
            bg = Image.new("RGB", image.size, (255, 255, 255))
            bg.paste(image, mask=image.split()[3])
            image = bg
        elif image.mode != "RGB":
            image = image.convert("RGB")

        img = np.array(image)
        h, w = img.shape[:2]
        if w <= 0 or h <= 0:
            raise ValueError(f"Invalid image dimensions: {w}x{h}")

        total = w * h
        is_large = total > LARGE_PIXELS
        is_small = total < SMALL_PIXELS

        if is_large:
            # LARGE (>9MP): Single pass on original - large images have enough detail
            t1 = time.time()
            merged = self._ocr_pass(img)
            logger.info(f"LARGE ({w}x{h}): pass1={time.time()-t1:.1f}s, words={len(merged)}")

            # Rescue pass if few results OR many low-confidence results
            low_conf_count = sum(1 for m in merged if m["confidence"] < 0.5)
            needs_rescue = len(merged) < MIN_WORDS_LARGE or (len(merged) > 0 and low_conf_count / len(merged) > 0.25)
            if needs_rescue:
                t2 = time.time()
                prep = self._preprocess(img)
                rescue = self._ocr_pass(prep, engine=self.ocr_sensitive)
                merged = self._merge(merged, rescue)
                logger.info(f"  rescue pass (low_conf={low_conf_count}): {time.time()-t2:.1f}s, total={len(merged)}")

        elif is_small:
            # SMALL (<0.64MP): Upscale first, then single pass with sensitive engine
            scale = 3.0 if max(w, h) < 600 else 2.0
            t1 = time.time()
            up = self._upscale(img, scale)
            up_prep = self._preprocess(up)
            merged = self._ocr_pass(up_prep, engine=self.ocr_sensitive)
            # Scale coordinates back (use round to prevent off-by-one)
            for item in merged:
                item["x"] = round(item["x"] / scale)
                item["y"] = round(item["y"] / scale)
                item["w"] = max(1, round(item["w"] / scale))
                item["h"] = max(1, round(item["h"] / scale))
            logger.info(f"SMALL ({w}x{h}): upscale={scale}x, pass={time.time()-t1:.1f}s, words={len(merged)}")

            # Rescue: also run on original if upscaled pass found very little
            if len(merged) < MIN_WORDS_SMALL:
                t2 = time.time()
                rescue = self._ocr_pass(img, engine=self.ocr_sensitive)
                merged = self._merge(merged, rescue)
                logger.info(f"  rescue pass: {time.time()-t2:.1f}s, total={len(merged)}")

        else:
            # MEDIUM (0.64-9MP): Single pass on original with primary engine
            # This is the MAIN optimization: was always doing 2 passes, now does 1
            t1 = time.time()
            merged = self._ocr_pass(img)
            logger.info(f"MEDIUM ({w}x{h}): pass1={time.time()-t1:.1f}s, words={len(merged)}")

            # Conditional rescue: if few results or many low-confidence results
            low_conf_count = sum(1 for m in merged if m["confidence"] < 0.5)
            needs_rescue = len(merged) < MIN_WORDS_MEDIUM or (len(merged) > 0 and low_conf_count / len(merged) > 0.25)
            if needs_rescue:
                t2 = time.time()
                prep = self._preprocess_adaptive(img)
                rescue = self._ocr_pass(prep, engine=self.ocr_sensitive)
                merged = self._merge(merged, rescue)
                logger.info(f"  rescue pass (low_conf={low_conf_count}): {time.time()-t2:.1f}s, total={len(merged)}")

        # Dark image inversion check (rare)
        gray = self._to_gray(img)
        if np.mean(gray) < 128:
            t3 = time.time()
            inv = cv2.bitwise_not(gray)
            _, binary = cv2.threshold(inv, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            inv_rgb = cv2.cvtColor(binary, cv2.COLOR_GRAY2RGB)
            inv_results = self._ocr_pass(inv_rgb)
            merged = self._merge(merged, inv_results)
            logger.info(f"  dark inversion: {time.time()-t3:.1f}s, total={len(merged)}")

        result = self._postprocess(merged)
        logger.info(f"TOTAL: {time.time()-t0:.1f}s, final_words={len(result)}")
        return result, w, h

    def _extract_results(self, results) -> List[dict]:
        items = []
        if not results or not results[0]:
            return items
        for line in results[0]:
            try:
                bbox, (text, conf) = line[0], (line[1][0], float(line[1][1]))
                xs = [p[0] for p in bbox]
                ys = [p[1] for p in bbox]
                w = int(max(xs) - min(xs))
                h = int(max(ys) - min(ys))
                if w <= 0 or h <= 0:
                    continue
                items.append({
                    "text": text,
                    "x": int(min(xs)), "y": int(min(ys)),
                    "w": w, "h": h,
                    "confidence": conf,
                })
            except (IndexError, ValueError, TypeError) as e:
                logger.warning(f"Skipping malformed OCR result: {e}")
                continue
        return items
