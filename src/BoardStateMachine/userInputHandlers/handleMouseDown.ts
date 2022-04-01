import { MouseEvent } from 'react';
import { MouseButton } from '../../interfaces';
import { setCurrentAction, setCursorPosition, setHasCursorMoved, setMouseButton } from '../../store/slices/boardSlice';
import { setDragOffset, setDraggedItemId, setSelectedItemId, setDragSelectedItemIds } from '../../store/slices/itemsSlice';
import { isPointInsideArea, getBoardCoordinates, getMaxCoordinates, isItemDraggable } from '../../utils';

import { store } from '../../store/store';
const { dispatch, getState } = store;

function handleMouseDown(e: MouseEvent<HTMLDivElement>): void {
    const { canvasTransform } = getState().board;
    const { items, selectedItemId, lineConnections, draggedItemId, dragSelectedItemIds } = getState().items;
    const { selectedTool } = getState().tools;

    const [screenX, screenY] = [e.clientX, e.clientY];
    dispatch(setCursorPosition([screenX, screenY]));
    dispatch(setHasCursorMoved(false));
    dispatch(setMouseButton(e.button));

    if (e.button === MouseButton.Left) {
        switch (selectedTool) {
            case 'POINTER':
                const [boardX, boardY] = getBoardCoordinates(screenX, screenY, canvasTransform);

                if (dragSelectedItemIds.length) {
                    const draggableItems = dragSelectedItemIds
                        .map((id) => items[id])
                        .filter((item) => isItemDraggable(item, lineConnections));
                    const { minX, maxX, minY, maxY } = getMaxCoordinates(draggableItems);
                    if (isPointInsideArea(boardX, boardY, { x0: minX, x2: maxX, y0: minY, y2: maxY })) {
                        // has group of selected items and clicked within the the group
                        dispatch(setDragOffset([boardX - minX, boardY - minY]));
                        dispatch(setCurrentAction('DRAG'));
                    } else {
                        // has a group of selected items but clicked outside
                        dispatch(setCurrentAction('IDLE'));
                        dispatch(setDragSelectedItemIds());
                    }
                } else {
                    const clickedItem = Object.values(items).find((item) => isPointInsideArea(boardX, boardY, item));
                    if (clickedItem) {
                        if (isItemDraggable(clickedItem, lineConnections)) {
                            dispatch(setDragOffset([boardX - clickedItem.x0, boardY - clickedItem.y0]));
                            dispatch(setDraggedItemId(clickedItem.id));
                        } else {
                            // dont set draggedItemId if not draggable
                            // a mouse move attempt will result in BLOCKED action
                            draggedItemId && dispatch(setDraggedItemId());
                        }
                        // deselect item if dragging a different item
                        if (clickedItem.id !== selectedItemId) dispatch(setSelectedItemId());
                        dispatch(setCurrentAction('DRAG'));
                    } else {
                        // nothing was clicked and there was no previous group selection
                        dispatch(setDragOffset([boardX, boardY]));
                        dispatch(setCurrentAction('DRAGSELECT'));
                    }
                }
                break;

            case 'NOTE':
                // notes are created on mouseUp
                selectedItemId && dispatch(setSelectedItemId());
                dispatch(setCurrentAction('IDLE'));
                break;

            default:
                // all other tools make items that need resize on creation
                selectedItemId && dispatch(setSelectedItemId());
                dispatch(setCurrentAction('RESIZE'));
        }
    } else if (e.button === MouseButton.Middle || e.button === MouseButton.Right) {
        dispatch(setCurrentAction('PAN'));
    }
}

export default handleMouseDown;