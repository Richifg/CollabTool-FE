import { MouseEvent } from 'react';
import { MouseButton, BoardItem, UpdateData } from '../../interfaces';
import { connectItem, processItemUpdates, updateConnectedLines, selectItems } from '../BoardStateMachineUtils';
import { setCursorPosition, setHasCursorMoved, setCurrentAction } from '../../store/slices/boardSlice';
import { setSelectedPoint } from '../../store/slices/itemsSlice';
import { translateCanvas } from '../../store/slices/boardSlice';
import {
    getBoardCoordinates,
    getTranslatedCoordinates,
    getResizedCoordinates,
    getMaxCoordinates,
    getNewItem,
    isAreaInsideArea,
    isItemDraggable,
    getItemAtPosition,
} from '../../utils';

import { store } from '../../store/store';
const { dispatch, getState } = store;

function handleMouseMove(e: MouseEvent): void {
    const { selectedTool } = getState().tools;
    const { currentAction, cursorPosition, canvasTransform, hasCursorMoved, mouseButton } = getState().board;
    const { items, selectedItemIds, draggedItemId, selectedPoint, dragOffset, lineConnections } = getState().items;

    const selectedItem = selectedItemIds.length === 1 ? items[selectedItemIds[0]] : undefined;

    const [screenX, screenY] = [e.clientX, e.clientY];
    dispatch(setCursorPosition([screenX, screenY]));
    const [boardX, boardY] = getBoardCoordinates(screenX, screenY, canvasTransform);
    !hasCursorMoved && mouseButton !== undefined && dispatch(setHasCursorMoved(true));

    if (mouseButton === MouseButton.Left) {
        switch (currentAction) {
            case 'DRAW':
                if (selectedItem?.type === 'drawing') {
                    const points = [...selectedItem.points, [boardX, boardY]] as [number, number][];
                    processItemUpdates({ id: selectedItem.id, points });
                }
                break;

            case 'DRAG':
                const ids = draggedItemId ? [draggedItemId] : selectedItemIds;
                const selectedItems = ids.map((id) => items[id]);
                const draggables = selectedItems.filter((item) => isItemDraggable(item, lineConnections, selectedItemIds));
                if (draggables.length) {
                    // dragOffset is relative to minX and minY of the draggable items
                    const { minX, minY } = getMaxCoordinates(draggables);
                    draggables.forEach((item) => {
                        // update coordinates of draggable items and their line connections
                        const { id, x0, y0 } = item;
                        const offset = { x: dragOffset.x + minX - x0, y: dragOffset.y + minY - y0 };
                        const newCoordinates = getTranslatedCoordinates(item, offset, boardX, boardY);
                        updateConnectedLines({ ...item, ...newCoordinates });
                        processItemUpdates({ id, ...newCoordinates });
                    });
                } else dispatch(setCurrentAction('BLOCKED'));
                break;

            case 'RESIZE':
                if (selectedItem && selectedPoint) {
                    const { type, id } = selectedItem;
                    const maintainRatio = type === 'note' || type === 'drawing';
                    const coordinates = getResizedCoordinates(selectedItem, selectedPoint, boardX, boardY, maintainRatio);
                    updateConnectedLines({ ...selectedItem, ...coordinates });
                    processItemUpdates({ id, ...coordinates });
                } else {
                    const itemUpdates: (BoardItem | UpdateData)[] = [];

                    // resizing without selectedItem means the item's gotta be created first
                    let newItem: BoardItem | undefined = undefined;
                    if (selectedTool === 'SHAPE') {
                        newItem = getNewItem(boardX, boardY, 'shape');
                        dispatch(setSelectedPoint('P2'));
                        dispatch(setCurrentAction('RESIZE'));
                    } else if (selectedTool === 'TEXT') {
                        newItem = getNewItem(boardX, boardY, 'text');
                        dispatch(setSelectedPoint('P2'));
                        dispatch(setCurrentAction('RESIZE'));
                    } else if (selectedTool === 'PEN') {
                        newItem = getNewItem(boardX, boardY, 'drawing');
                        dispatch(setCurrentAction('DRAW'));
                    } else if (selectedTool === 'LINE') {
                        newItem = getNewItem(boardX, boardY, 'line');
                        // when creating a line it could be connected to an item right away
                        const itemUnderCursor = getItemAtPosition(boardX, boardY, Object.values(items));
                        if (itemUnderCursor) itemUpdates.push(...connectItem(itemUnderCursor, newItem, 'P0', boardX, boardY));
                        dispatch(setSelectedPoint('P2'));
                        dispatch(setCurrentAction('RESIZE'));
                    }
                    if (newItem) {
                        itemUpdates.push(newItem);
                        processItemUpdates(itemUpdates);
                        selectItems(newItem.id);
                    }
                }
                break;

            case 'DRAGSELECT':
                let coveredItemIds: string[] = [];
                if (hasCursorMoved) {
                    const areaCoordinates = { x0: dragOffset.x, y0: dragOffset.y, x2: boardX, y2: boardY };
                    const insideItems = Object.values(items).filter((item) => isAreaInsideArea(item, areaCoordinates));
                    coveredItemIds = insideItems.map((item) => item.id);
                }
                // clear selection or select covered items
                selectItems(coveredItemIds);
                break;
        }
        // update all items in bulk
    } else if (mouseButton === MouseButton.Middle || mouseButton === MouseButton.Right) {
        // middle and right buttons always pan camera
        dispatch(translateCanvas([screenX - cursorPosition.x, screenY - cursorPosition.y]));
    }
}

export default handleMouseMove;
