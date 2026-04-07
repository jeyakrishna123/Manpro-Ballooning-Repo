import os
import time

from fastapi import FastAPI, File, UploadFile

from models import OcrResponse
from ocr_engine import PaddleOcrEngine

app = FastAPI(title="PaddleOCR Service", version="2.0.0")

# Initialize engine once at startup
USE_GPU = os.environ.get("PADDLEOCR_USE_GPU", "false").lower() == "true"
engine = PaddleOcrEngine(use_gpu=USE_GPU)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "engine": "paddleocr", "version": "2.0.0", "gpu": USE_GPU}


@app.post("/ocr", response_model=OcrResponse)
async def perform_ocr(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        start = time.time()
        words, img_width, img_height = engine.process_image(image_bytes)
        elapsed = time.time() - start
        return OcrResponse(
            words=words,
            image_width=img_width,
            image_height=img_height,
            engine="paddleocr-v4",
            success=True,
        )
    except Exception as e:
        return OcrResponse(
            words=[],
            image_width=0,
            image_height=0,
            engine="paddleocr-v4",
            success=False,
            error_message=str(e),
        )


@app.post("/ocr/fast", response_model=OcrResponse)
async def perform_ocr_fast(file: UploadFile = File(...)):
    """Fast OCR endpoint - single pass, lower resolution detection for speed."""
    try:
        image_bytes = await file.read()
        start = time.time()
        words, img_width, img_height = engine.process_image_fast(image_bytes)
        elapsed = time.time() - start
        return OcrResponse(
            words=words,
            image_width=img_width,
            image_height=img_height,
            engine="paddleocr-v4-fast",
            success=True,
        )
    except Exception as e:
        return OcrResponse(
            words=[],
            image_width=0,
            image_height=0,
            engine="paddleocr-v4-fast",
            success=False,
            error_message=str(e),
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PADDLEOCR_PORT", "5100"))
    uvicorn.run(app, host="0.0.0.0", port=port)
