import { MouseEvent } from 'react';
import { MouseButton, BoardItem } from '../../interfaces';
import { setNoteStyle } from '../../store/slices/toolSlice';
import { setCurrentAction, setIsWriting, setMouseButton } from '../../store/slices/boardSlice';
import { setDraggedItemId, setSelectedItemId, setDragSelectedItemIds, setInProgress } from '../../store/slices/itemsSlice';
import { isMainPoint, getBoardCoordinates, getRelativeDrawing, getItemAtPosition, getNewItem } from '../../utils';

import { disconnectItem, connectItem, updateBoardLimits, pushItemChanges } from '../BoardStateMachineUtils';

import { store } from '../../store/store';
const { dispatch, getState } = store;

function handleMouseUp(e: MouseEvent<HTMLDivElement>): void {
    const { selectedTool } = getState().tools;
    const { items, selectedItemId, selectedPoint, dragSelectedItemIds, draggedItemId } = getState().items;
    const { currentAction, canvasTransform, isWriting, hasCursorMoved } = getState().board;
    const selectedItem = selectedItemId ? items[selectedItemId] : undefined;

    // then mouseUp will clean up
    dispatch(setMouseButton());
    const [boardX, boardY] = getBoardCoordinates(e.clientX, e.clientY, canvasTransform);
    const itemUnderCursor = getItemAtPosition(boardX, boardY, Object.values(items), [selectedItem]);

    const editedItems: BoardItem[] = [];
    const newItems: BoardItem[] = [];

    if (e.button === MouseButton.Left) {
        switch (currentAction) {
            case 'IDLE':
                if (selectedTool === 'NOTE') {
                    const note = getNewItem(boardX, boardY, 0, 'note');
                    newItems.push(note);
                    dispatch(setCurrentAction('EDIT'));
                }
                break;

            case 'DRAW':
                if (selectedItem?.type === 'drawing') {
                    // transformed in-progress drawing into relative coordinates drawing
                    const finishedDrawing = getRelativeDrawing(selectedItem);
                    newItems.push(finishedDrawing);
                    dispatch(setCurrentAction('IDLE'));
                }
                break;

            case 'DRAG':
                if (dragSelectedItemIds.length) {
                    editedItems.push(...dragSelectedItemIds.map((id) => items[id]));
                    dispatch(setCurrentAction('EDIT'));
                } else {
                    dispatch(setDraggedItemId());
                    if (!hasCursorMoved) {
                        // click on top of an item without moving cursor means the item has to be selected
                        if (itemUnderCursor) dispatch(setSelectedItemId(itemUnderCursor.id));
                        else !isWriting && dispatch(setIsWriting(true));
                        dispatch(setCurrentAction('EDIT'));
                    } else {
                        // otherwise an item was dragged and could be editted
                        if (draggedItemId) {
                            dispatch(setCurrentAction('EDIT'));
                            editedItems.push(items[draggedItemId]);
                        } else dispatch(setCurrentAction('IDLE'));
                    }
                }
                break;

            case 'RESIZE':
                selectedItem && editedItems.push(selectedItem);
                if (selectedItem?.type === 'note') {
                    // resizing an Note involves updating preffered Note size
                    const { fillColor } = selectedItem;
                    const size = Math.abs(selectedItem.x2 - selectedItem.x0);
                    dispatch(setNoteStyle({ fillColor, size }));
                } else if (selectedItem?.type === 'line' && isMainPoint(selectedPoint)) {
                    // only connect Lines to other non-Line items
                    if (itemUnderCursor && itemUnderCursor.type !== 'line') {
                        connectItem(itemUnderCursor, selectedItem, selectedPoint, boardX, boardY);
                    } else disconnectItem(selectedItem, selectedPoint);
                }
                dispatch(setCurrentAction('EDIT'));
                break;

            case 'DRAGSELECT':
                // if cursor moved then multiple items might have been selected
                if (hasCursorMoved) {
                    isWriting && dispatch(setIsWriting(false));
                    if (dragSelectedItemIds.length) {
                        dragSelectedItemIds.length === 1 && dispatch(setSelectedItemId(dragSelectedItemIds[0]));
                        dispatch(setCurrentAction('EDIT'));
                    } else {
                        selectedItem && dispatch(setSelectedItemId());
                        dispatch(setCurrentAction('IDLE'));
                    }
                } else if (itemUnderCursor) {
                    dispatch(setSelectedItemId(itemUnderCursor.id));
                    dispatch(setCurrentAction('EDIT'));
                } else if (dragSelectedItemIds) {
                    dispatch(setDragSelectedItemIds());
                    dispatch(setCurrentAction('IDLE'));
                }
                break;

            case 'BLOCKED':
                dispatch(setCurrentAction('IDLE'));
                break;
        }
    } else if (e.button === MouseButton.Middle || e.button === MouseButton.Right) {
        if (currentAction === 'PAN') {
            dispatch(setCurrentAction('SLIDE'));
        }
    }

    // apply last item changes before sync
    dispatch(setInProgress(false));
    pushItemChanges(newItems);

    // update final board limits
    [...editedItems, ...newItems].forEach((item) => updateBoardLimits(item));
}

export default handleMouseUp;
