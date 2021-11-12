import { MouseEvent, WheelEvent } from 'react';
import { store } from '../store/store';
import { setCurrentAction, setCursorPosition, setCanvasSize, translateCanvas, scaleCanvas } from '../store/slices/boardSlice';
import { addUserItem, setSelectedItem, setSelectedPoint } from '../store/slices/itemsSlice';
import { getItemResizePoints, getItemTranslatePoints, isPointInsideItem } from '../utils';

const { dispatch, getState } = store;

const BoardStateMachine = {
    mouseDown(e: React.MouseEvent<HTMLDivElement>): void {
        const { currentAction, selectedTool, canvasTransform } = getState().board;
        const { defaultItem, selectedItem, items, userItems } = getState().items;
        const allItems = [...items, ...userItems];
        const [x, y] = [e.clientX, e.clientY];
        dispatch(setCursorPosition([x, y]));
        switch (currentAction) {
            case 'IDLE':
            case 'SLIDE':
                if (selectedTool === 'POINTER') {
                    const item = allItems.find((item) => isPointInsideItem(x, y, item, canvasTransform));
                    if (item) {
                        dispatch(setSelectedItem(item));
                        dispatch(setCurrentAction('DRAG'));
                    } else {
                        dispatch(setCurrentAction('PAN'));
                    }
                }
                if (selectedTool === 'SHAPE') {
                    dispatch(setSelectedPoint('P2'));
                    const { dX, dY } = canvasTransform;
                    const id = '123132';
                    const newItem = { ...defaultItem, id, x0: x - dX, y0: y - dY, x2: x - dX, y2: y - dY };
                    dispatch(addUserItem(newItem));
                    dispatch(setCurrentAction('RESIZE'));
                }
                break;
            case 'EDIT':
                // ##TODO how to determine if a click was inside an element quickly? cool algorithm shit
                // possibly RESIZE or DRAG depending on point clicked
                const item = allItems.find((item) => isPointInsideItem(x, y, item, canvasTransform));
                if (item) {
                    if (item.id !== selectedItem?.id) dispatch(setSelectedItem(item));
                    dispatch(setCurrentAction('DRAG'));
                } else {
                    dispatch(setCurrentAction('IDLE'));
                    dispatch(setSelectedItem());
                }
                break;
            default:
                break;
        }
    },

    mouseMove(e: React.MouseEvent<HTMLDivElement>): void {
        const { currentAction, cursorPosition, canvasTransform } = getState().board;
        const { selectedItem, selectedPoint } = getState().items;
        const [x, y] = [e.clientX, e.clientY];
        dispatch(setCursorPosition([x, y]));
        switch (currentAction) {
            // ##TODO possibly a case IDLE checking if mouseButton is clicked and transition to PAN
            case 'PAN':
                dispatch(translateCanvas([x - cursorPosition.x, y - cursorPosition.y]));
                break;
            case 'DRAG':
                if (selectedItem?.type === 'shape' && selectedPoint) {
                    const { x0, y0, x2, y2 } = getItemTranslatePoints(selectedItem, selectedPoint, x, y, canvasTransform);
                    dispatch(addUserItem({ ...selectedItem, x0, y0, x2, y2 }));
                }
                break;
            case 'RESIZE':
                if (selectedItem?.type === 'shape' && selectedPoint) {
                    const { x0, y0, x2, y2 } = getItemResizePoints(selectedItem, selectedPoint, x, y, canvasTransform);
                    dispatch(addUserItem({ ...selectedItem, x0, y0, x2, y2 }));
                }
                break;
        }
    },

    mouseUp(e: React.MouseEvent<HTMLDivElement>): void {
        const { currentAction } = getState().board;
        dispatch(setCursorPosition([e.clientX, e.clientY]));
        switch (currentAction) {
            case 'PAN':
                dispatch(setCurrentAction('SLIDE'));
                break;
            case 'DRAG':
                dispatch(setCurrentAction('EDIT'));
                break;
            case 'RESIZE':
                dispatch(setCurrentAction('EDIT'));
                break;
            default:
                break;
        }
    },

    mouseWheel(e: WheelEvent<HTMLDivElement>): void {
        const delta = -Math.round(e.deltaY) * 0.0005;
        dispatch(scaleCanvas(delta));
    },

    windowResize(): void {
        dispatch(setCanvasSize({ width: window.innerWidth, height: window.innerHeight }));
    },
};

export default BoardStateMachine;
