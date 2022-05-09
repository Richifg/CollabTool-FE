import { MouseEvent } from 'react';
import { setNoteStyle } from '../../store/slices/toolSlice';
import { setInProgress } from '../../store/slices/itemsSlice';
import { setCurrentAction, setIsWriting, setMouseButton } from '../../store/slices/boardSlice';
import { isMainPoint, getBoardCoordinates, getRelativeDrawing, getItemAtPosition, getNewItem } from '../../utils';
import { MouseButton, BoardItem, UpdateData } from '../../interfaces';

import { disconnectItem, connectItem, processItemUpdates, selectItems, selectQuickDragItem } from '../BoardStateMachineUtils';

import { store } from '../../store/store';
const { dispatch, getState } = store;

function handleMouseUp(e: MouseEvent<HTMLDivElement>): void {
    const { selectedTool } = getState().tools;
    const { items, selectedItemIds, selectedPoint, draggedItemId } = getState().items;
    const { currentAction, canvasTransform, isWriting, hasCursorMoved } = getState().board;

    const selectedItem = selectedItemIds.length === 1 ? items[selectedItemIds[0]] : undefined;

    // then mouseUp will clean up
    dispatch(setMouseButton());
    const [boardX, boardY] = getBoardCoordinates(e.clientX, e.clientY, canvasTransform);
    const itemUnderCursor = getItemAtPosition(boardX, boardY, Object.values(items), [selectedItem]);

    const itemUpdates: (BoardItem | UpdateData)[] = [];
    let idsToSelect: string[] = [];
    let hasSelectionChanged = false;

    if (e.button === MouseButton.Left) {
        switch (currentAction) {
            case 'IDLE':
                if (selectedTool === 'NOTE') {
                    const note = getNewItem(boardX, boardY, 'note');
                    itemUpdates.push(note);
                    dispatch(setCurrentAction('EDIT'));
                }
                break;

            case 'DRAW':
                if (selectedItem?.type === 'drawing') {
                    // transformed in-progress drawing into relative coordinates drawing
                    const finishedDrawing = getRelativeDrawing(selectedItem);
                    itemUpdates.push(finishedDrawing);
                    dispatch(setCurrentAction('IDLE'));
                }
                break;

            case 'DRAG':
                // edit the selected item
                if (selectedItemIds.length) {
                    dispatch(setCurrentAction('EDIT'));
                } else {
                    if (!hasCursorMoved) {
                        // click on top of an item without moving cursor means the item has to be selected
                        if (itemUnderCursor) {
                            idsToSelect = [itemUnderCursor.id];
                            hasSelectionChanged = true;
                        } else !isWriting && dispatch(setIsWriting(true));
                        dispatch(setCurrentAction('EDIT'));
                    } else {
                        // otherwise an item was dragged and could be editted
                        // TODO TODO not sure if this can happen
                        if (draggedItemId) dispatch(setCurrentAction('EDIT'));
                        else dispatch(setCurrentAction('IDLE'));
                    }
                    selectQuickDragItem();
                }
                break;

            case 'RESIZE':
                if (selectedItem?.type === 'note') {
                    // resizing an Note involves updating preffered Note size
                    const { fillColor } = selectedItem;
                    const size = Math.abs(selectedItem.x2 - selectedItem.x0);
                    dispatch(setNoteStyle({ fillColor, size }));
                } else if (selectedItem?.type === 'line' && isMainPoint(selectedPoint)) {
                    // only connect Lines to other non-Line items
                    const connectionUpdates: (UpdateData | undefined)[] = [];
                    if (itemUnderCursor && itemUnderCursor.type !== 'line') {
                        connectionUpdates.push(...connectItem(itemUnderCursor, selectedItem, selectedPoint, boardX, boardY));
                    } else connectionUpdates.push(disconnectItem(selectedItem, selectedPoint));
                    connectionUpdates.length && itemUpdates.push(...(connectionUpdates.filter((i) => !!i) as UpdateData[]));
                }
                dispatch(setCurrentAction('EDIT'));
                break;

            case 'DRAGSELECT':
                // if cursor moved then multiple items might have been selected
                if (hasCursorMoved) {
                    isWriting && dispatch(setIsWriting(false));
                    if (selectedItemIds.length) dispatch(setCurrentAction('EDIT'));
                    else dispatch(setCurrentAction('IDLE'));
                } else {
                    idsToSelect = [];
                    hasSelectionChanged = true;
                    dispatch(setCurrentAction('IDLE'));
                }
                break;

            case 'BLOCKED':
                dispatch(setCurrentAction('IDLE'));
                break;
        }
        // allow BE sync
        dispatch(setInProgress(false));
        // select items again for syncing lock
        if (!hasSelectionChanged) idsToSelect = selectedItemIds;
        selectItems(idsToSelect);
        // process last updates before syncing items
        processItemUpdates(itemUpdates);
    } else if (e.button === MouseButton.Middle || e.button === MouseButton.Right) {
        if (currentAction === 'PAN') {
            dispatch(setCurrentAction('SLIDE'));
        }
    }
}

export default handleMouseUp;
