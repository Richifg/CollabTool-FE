import React, { useState, useLayoutEffect } from 'react';
import { Circle, Rect, Item } from '../interfaces/items';

interface useDrawShapeReturn {
    drawShape(item: Item): void;
    transform(sX: number, skY: number, skX: number, sY: number, dX: number, dY: number): void;
    clear(): void;
}

const useCanvasDraw = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    width: number,
    height: number,
): useDrawShapeReturn => {
    const [ctx, setCtx] = useState<CanvasRenderingContext2D>();
    // capture the rendering context before first render
    useLayoutEffect(() => {
        const renderingContext = canvasRef.current?.getContext('2d');
        if (renderingContext) setCtx(renderingContext);
    }, []);

    const drawShape = (item: Item) => {
        if (ctx && item.type === 'shape') {
            ctx.save();
            if (item?.strokeColor) ctx.strokeStyle = item.strokeColor;
            if (item.shapeType === 'circle') drawCircle(item);
            if (item.shapeType === 'rect') drawRect(item);
            ctx.restore();
        }
    };

    const drawCircle = (circle: Circle) => {
        if (ctx) {
            const { cX, cY, rX, rY, backgroundColor } = circle;
            ctx.beginPath();
            ctx.ellipse(cX, cY, rX, rY, 0, 0, Math.PI * 2);
            if (backgroundColor) {
                ctx.fillStyle = backgroundColor;
                ctx.fill();
            } else {
                ctx.stroke();
            }
        }
    };
    const drawRect = (rect: Rect) => {
        if (ctx) {
            const { x, y, width, height, backgroundColor } = rect;
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            if (backgroundColor) {
                ctx.fillStyle = backgroundColor;
                ctx.fill();
            } else {
                ctx.stroke();
            }
        }
    };

    const transform = (sX: number, skY: number, skX: number, sY: number, dX: number, dY: number) => {
        ctx?.transform(sX, skY, skX, sY, dX, dY);
    };

    const clear = () => {
        if (ctx) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, width, height);
            ctx.restore();
        }
    };

    return {
        drawShape,
        transform,
        clear,
    };
};

export default useCanvasDraw;
