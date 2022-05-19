import { store } from '../store/store';

const INIT_GRID_SIZE = 20; //px
const MIN_GRID_RENDER_SIZE = 20; //px
const MAX_GRID_RENDER_SIZE = 250; //px

function drawGrid(ctx: CanvasRenderingContext2D): void {
    const { canvasSize, canvasTransform } = store.getState().board;
    const { width, height } = canvasSize;
    const { scale, dX, dY } = canvasTransform;

    // calculate initial small gridSize so that it isn't too small on current scale
    let smallGridSize = INIT_GRID_SIZE;
    while (smallGridSize * scale < MIN_GRID_RENDER_SIZE) {
        smallGridSize *= 5;
    }
    // big gridSize is always 5 times as big as smaller one
    const bigGridSize = 5 * smallGridSize;

    ctx.save();

    const [initX, initY] = [0, 0];
    const [endX, endY] = [width, height];
    [smallGridSize, bigGridSize].forEach((size) => {
        // do not draw grid if divisions are too big
        const scaledGridSize = size * scale;
        if (scaledGridSize < MAX_GRID_RENDER_SIZE) {
            const [offsetX, offsetY] = [dX % scaledGridSize, dY % scaledGridSize];

            // the smaller the subdivisions the lighter they are drawn
            const lightness = 95 + 5 * (MIN_GRID_RENDER_SIZE / scaledGridSize);
            ctx.strokeStyle = `hsl(0, 0%, ${lightness}%)`;

            ctx.beginPath();
            for (let x = initX + offsetX; x < endX; x += scaledGridSize) {
                ctx.moveTo(x, initY);
                ctx.lineTo(x, endY);
            }
            for (let y = initY + offsetY; y < endY; y += scaledGridSize) {
                ctx.moveTo(initX, y);
                ctx.lineTo(endX, y);
            }
            ctx.stroke();
        }
    });
    ctx.restore();
}

export default drawGrid;
