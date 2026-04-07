import React, { useMemo, useCallback } from "react";
import { Group, Text, Shape } from "react-konva";
import useStore from "../Store/store";

/**
 * WatermarkOverlay — renders a watermark on the Konva canvas.
 *
 * Single mode: one draggable text — user can click & drag to position it.
 * Tiled/Diagonal mode: repeated pattern using a single Shape for performance.
 *
 * Props:
 *   areaW, areaH — drawing area width/height (image-space coordinates)
 *   offsetX, offsetY — drawing area origin offset
 */
const WatermarkOverlay = ({ areaW, areaH, offsetX = 0, offsetY = 0, exportScale = 1, imgW, imgH }) => {
    const watermark = useStore((s) => s.watermark);
    const isExport = exportScale !== 1;
    // Use image dimensions for ratio calculation; fall back to areaW/areaH if not provided
    const imageW = imgW || areaW;
    const imageH = imgH || areaH;

    // When user drags the single watermark, save position as ratio (0-1) relative to the actual image
    const handleDragEnd = useCallback((e) => {
        const wm = useStore.getState().watermark;
        // Store as ratio (0-1) relative to the image so it maps correctly to export
        const ratioX = (e.target.x() - offsetX) / imageW;
        const ratioY = (e.target.y() - offsetY) / imageH;
        useStore.setState({
            watermark: {
                ...wm,
                customX: e.target.x(),
                customY: e.target.y(),
                ratioX: ratioX,
                ratioY: ratioY,
            }
        });
    }, [imageW, imageH, offsetX, offsetY]);

    // Pre-compute tile positions for tiled/diagonal layouts
    const tiledPositions = useMemo(() => {
        if (!watermark || !watermark.enabled || !watermark.text || areaW <= 0 || areaH <= 0) {
            return null;
        }
        if (watermark.layout === "single") return null;

        const { layout } = watermark;
        const fs = watermark.fontSize * exportScale;
        const sx = Math.max((watermark.spacingX || 400) * exportScale, fs * 2);
        const sy = Math.max((watermark.spacingY || 250) * exportScale, fs * 1.5);
        const positions = [];
        // Generate tiles covering the full area with padding
        const startX = offsetX;
        const startY = offsetY;
        const endX = offsetX + areaW;
        const endY = offsetY + areaH;
        const padX = sx * 2;
        const padY = sy * 2;

        let row = 0;
        for (let ty = startY - padY; ty < endY + padY; ty += sy) {
            const rowShift = (layout === "diagonal" && row % 2 === 1) ? sx / 2 : 0;
            for (let tx = startX - padX + rowShift; tx < endX + padX; tx += sx) {
                positions.push({ x: tx, y: ty });
            }
            row++;
        }
        return positions;
    }, [watermark, areaW, areaH, offsetX, offsetY, exportScale]);

    if (!watermark || !watermark.enabled || !watermark.text || areaW <= 0 || areaH <= 0) {
        return null;
    }

    const { text, fontFamily, fontWeight, color, opacity, rotation, layout } = watermark;
    const fontSize = watermark.fontSize * exportScale;
    const rad = (rotation * Math.PI) / 180;

    // ─── SINGLE MODE: Draggable Konva Text ───
    if (layout === "single") {
        let posX, posY;
        if (watermark.customX != null && watermark.customY != null) {
            if (isExport) {
                // Use stored ratio to map screen position to export position
                // ratioX/ratioY represent the watermark's position as a fraction (0-1) of the image
                const ratioX = watermark.ratioX != null ? watermark.ratioX : (watermark.customX - offsetX) / imageW;
                const ratioY = watermark.ratioY != null ? watermark.ratioY : (watermark.customY - offsetY) / imageH;
                posX = offsetX + ratioX * imageW;
                posY = offsetY + ratioY * imageH;
            } else {
                posX = watermark.customX;
                posY = watermark.customY;
            }
        } else {
            posX = offsetX + areaW / 2;
            posY = offsetY + areaH / 2;
        }

        return (
            <Text
                text={text}
                x={posX}
                y={posY}
                fontSize={fontSize}
                fontFamily={fontFamily}
                fontStyle={fontWeight}
                fill={color}
                opacity={opacity}
                rotation={rotation}
                align="center"
                verticalAlign="middle"
                draggable={!isExport}
                onDragEnd={isExport ? undefined : handleDragEnd}
                onMouseEnter={isExport ? undefined : (e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = "move";
                }}
                onMouseLeave={isExport ? undefined : (e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = "default";
                }}
            />
        );
    }

    // ─── TILED / DIAGONAL MODE: Single Shape for performance ───
    if (!tiledPositions || tiledPositions.length === 0) return null;

    return (
        <Group listening={false}>
            <Shape
                sceneFunc={(context) => {
                    const ctx = context._context;
                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.fillStyle = color;
                    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    // Clip to drawing area
                    ctx.beginPath();
                    ctx.rect(offsetX, offsetY, areaW, areaH);
                    ctx.clip();

                    for (let i = 0; i < tiledPositions.length; i++) {
                        const p = tiledPositions[i];
                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate(rad);
                        ctx.fillText(text, 0, 0);
                        ctx.restore();
                    }

                    ctx.restore();
                }}
                listening={false}
                perfectDrawEnabled={false}
            />
        </Group>
    );
};

export default React.memo(WatermarkOverlay);
