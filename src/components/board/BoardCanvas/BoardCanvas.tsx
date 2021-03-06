import React, { useRef, useMemo } from 'react';
import { setCurrentAction, translateCanvas } from '../../../store/slices/boardSlice';
import { useCanvas, useDispatch, useSelector, useCameraSlide } from '../../../hooks';
import styles from './BoardCanvas.module.scss';

const BoardCanvas = (): React.ReactElement => {
    const dispatch = useDispatch();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { items, selectedItemIds } = useSelector((s) => s.items);
    const { canvasSize, lastTranslate, currentAction } = useSelector((s) => s.board);
    const { width, height } = canvasSize;

    const orderedItems = useMemo(
        // items are ordered by zIndex first and then creation date (new ones should be on top)
        () =>
            Object.values(items).sort((a, b) =>
                a.zIndex > b.zIndex || (a.zIndex === b.zIndex && a.creationDate > b.creationDate) ? 1 : -1,
            ),
        [items],
    );

    // renders items on every update
    useCanvas(canvasRef, orderedItems);

    // controls camera slide after user pans the camera
    useCameraSlide(
        lastTranslate,
        currentAction === 'SLIDE',
        (x: number, y: number) => dispatch(translateCanvas([x, y])),
        () => dispatch(setCurrentAction(selectedItemIds.length ? 'EDIT' : 'IDLE')),
    );

    return (
        <canvas
            role="application"
            className={styles.canvas}
            id="items"
            ref={canvasRef}
            width={width}
            height={height}
            onContextMenu={(e) => e.preventDefault()}
        >
            <p className={styles.noSupport}>This application requires the use of a canvas supporting browser</p>
        </canvas>
    );
};

export default BoardCanvas;
