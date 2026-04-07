"""
PaddleOCR Accuracy Test Script
Tests OCR accuracy on sample engineering drawings.
Usage: python test_accuracy.py [image_path]
"""
import sys
import os
import time
import json
import requests

SERVICE_URL = "http://localhost:5100"

def test_health():
    """Check if PaddleOCR service is running."""
    try:
        r = requests.get(f"{SERVICE_URL}/health", timeout=5)
        return r.status_code == 200
    except:
        return False

def run_ocr(image_path):
    """Send image to PaddleOCR service and return results."""
    with open(image_path, "rb") as f:
        files = {"file": (os.path.basename(image_path), f, "image/png")}
        start = time.time()
        r = requests.post(f"{SERVICE_URL}/ocr", files=files, timeout=120)
        elapsed = time.time() - start

    if r.status_code != 200:
        print(f"  ERROR: HTTP {r.status_code}")
        return None, elapsed

    data = r.json()
    return data, elapsed

def print_results(data, elapsed, image_path):
    """Print OCR results in a readable format."""
    fname = os.path.basename(image_path)
    print(f"\n{'='*70}")
    print(f"  IMAGE: {fname}")
    print(f"  SIZE: {os.path.getsize(image_path) / 1024:.1f} KB")
    print(f"  TIME: {elapsed:.2f}s")
    print(f"{'='*70}")

    if not data or not data.get("success"):
        print(f"  FAILED: {data.get('error_message', 'Unknown error')}")
        return

    words = data.get("words", [])
    print(f"  WORDS DETECTED: {len(words)}")
    print(f"  IMAGE DIMENSIONS: {data.get('image_width', '?')} x {data.get('image_height', '?')}")
    print(f"  ENGINE: {data.get('engine', '?')}")

    if not words:
        print("  No text detected!")
        return

    # Confidence stats
    confidences = [w["confidence"] for w in words]
    avg_conf = sum(confidences) / len(confidences)
    min_conf = min(confidences)
    max_conf = max(confidences)
    high_conf = sum(1 for c in confidences if c >= 0.90)

    print(f"\n  CONFIDENCE STATS:")
    print(f"    Average: {avg_conf:.1%}")
    print(f"    Min:     {min_conf:.1%}")
    print(f"    Max:     {max_conf:.1%}")
    print(f"    >= 90%:  {high_conf}/{len(words)} words ({high_conf/len(words):.0%})")

    # Print all detected words sorted by Y then X position
    print(f"\n  DETECTED TEXT (sorted by position):")
    print(f"  {'No':>4} {'Conf':>6} {'X':>6} {'Y':>6} {'W':>5} {'H':>5}  Text")
    print(f"  {'-'*4} {'-'*6} {'-'*6} {'-'*6} {'-'*5} {'-'*5}  {'-'*30}")

    sorted_words = sorted(words, key=lambda w: (w["y"], w["x"]))
    for i, w in enumerate(sorted_words, 1):
        conf_marker = "+" if w["confidence"] >= 0.90 else "-"
        print(f"  {i:4d} {w['confidence']:5.1%}{conf_marker} {w['x']:6d} {w['y']:6d} {w['width']:5d} {w['height']:5d}  {w['text']}")

    # Group into lines (words with similar Y)
    print(f"\n  GROUPED TEXT (by line):")
    lines = []
    current_line = []
    last_y = -999

    for w in sorted_words:
        if abs(w["y"] - last_y) > 20:  # New line if Y differs by > 20px
            if current_line:
                lines.append(current_line)
            current_line = [w]
        else:
            current_line.append(w)
        last_y = w["y"]
    if current_line:
        lines.append(current_line)

    for i, line in enumerate(lines, 1):
        text = " ".join(w["text"] for w in sorted(line, key=lambda w: w["x"]))
        avg_line_conf = sum(w["confidence"] for w in line) / len(line)
        print(f"  Line {i:3d} [{avg_line_conf:.0%}]: {text}")

    print(f"\n  TOTAL LINES: {len(lines)}")


def main():
    # Default test images
    base = os.path.dirname(os.path.abspath(__file__))
    parent = os.path.dirname(base)

    default_images = [
        os.path.join(parent, "gg13311-a-001.png"),
        os.path.join(parent, "v170865-b-001.png"),
        os.path.join(parent, "23-32-001.jpg"),
    ]

    # Use command line arg or defaults
    if len(sys.argv) > 1:
        images = [sys.argv[1]]
    else:
        images = [img for img in default_images if os.path.exists(img)]

    if not images:
        print("No test images found! Provide an image path as argument.")
        sys.exit(1)

    print("=" * 70)
    print("  PADDLEOCR ACCURACY TEST")
    print("=" * 70)

    # Check service
    print("\nChecking PaddleOCR service...")
    if not test_health():
        print("ERROR: PaddleOCR service is not running!")
        print(f"Start it with: cd paddleocr-service && venv/Scripts/python -m uvicorn main:app --port 5100")
        sys.exit(1)
    print("Service is UP!")

    print(f"\nTesting {len(images)} image(s)...")

    total_words = 0
    total_high_conf = 0
    total_time = 0

    for img in images:
        if not os.path.exists(img):
            print(f"\nSkipping {img} - file not found")
            continue

        data, elapsed = run_ocr(img)
        print_results(data, elapsed, img)

        if data and data.get("success"):
            words = data.get("words", [])
            total_words += len(words)
            total_high_conf += sum(1 for w in words if w["confidence"] >= 0.90)
            total_time += elapsed

    # Summary
    print(f"\n{'='*70}")
    print(f"  SUMMARY")
    print(f"{'='*70}")
    print(f"  Images tested: {len(images)}")
    print(f"  Total words:   {total_words}")
    print(f"  High conf (>=90%): {total_high_conf}/{total_words} ({total_high_conf/max(total_words,1):.0%})")
    print(f"  Total OCR time: {total_time:.2f}s")
    print(f"  Avg per image:  {total_time/max(len(images),1):.2f}s")


if __name__ == "__main__":
    main()
