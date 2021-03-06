import React, { useMemo } from 'react';
import { Point, Action } from '../../../interfaces';
import { useSelector, useDispatch } from '../../../hooks';
import { setSelectedPoint, setInProgress } from '../../../store/slices/itemsSlice';
import { setCurrentAction, setMouseButton } from '../../../store/slices/boardSlice';

import styles from './EditPoints.module.scss';
import getEditPoints from './getEditPoints';

const EditPointsActions: Action[] = ['EDIT', 'RESIZE'];

const EditPoints = (): React.ReactElement => {
    const dispatch = useDispatch();
    const { items, selectedItemIds } = useSelector((s) => s.items);
    const { canvasTransform, currentAction } = useSelector((s) => s.board);
    const { selectedTool } = useSelector((s) => s.tools);
    const selectedItem = selectedItemIds.length === 1 ? items[selectedItemIds[0]] : undefined;

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        const point = e.currentTarget.id as Point;
        dispatch(setMouseButton(e.button));
        dispatch(setSelectedPoint(point));
        dispatch(setCurrentAction('RESIZE'));
        dispatch(setInProgress(true));
    };

    const points = useMemo(
        () => (selectedItem ? getEditPoints(selectedItem, canvasTransform) : []),
        [canvasTransform, selectedItem],
    );

    const isPointer = selectedTool === 'POINTER';
    return (
        <div className={styles.editPoints}>
            {EditPointsActions.includes(currentAction) &&
                points.map(([point, x, y]) => (
                    <div
                        key={point}
                        id={point}
                        className={`${styles.point} ${isPointer ? styles.grab : ''}`}
                        style={{ left: x, top: y }}
                        onPointerDown={handleMouseDown}
                    />
                ))}
        </div>
    );
};

export default EditPoints;
