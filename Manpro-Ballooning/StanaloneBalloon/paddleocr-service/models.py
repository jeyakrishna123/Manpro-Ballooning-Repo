from pydantic import BaseModel
from typing import List, Optional


class OcrWordResult(BaseModel):
    text: str
    x: int
    y: int
    width: int
    height: int
    confidence: float


class OcrResponse(BaseModel):
    words: List[OcrWordResult]
    image_width: int
    image_height: int
    engine: str = "paddleocr"
    success: bool
    error_message: Optional[str] = None
