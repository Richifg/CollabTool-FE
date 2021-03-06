import React from 'react';
import { useDispatch, useSelector } from '../../../hooks';
import { setSelectedShapeType, setSelectedTool } from '../../../store/slices/toolSlice';
import { setCurrentAction } from '../../../store/slices/boardSlice';
import { selectItems } from '../../../BoardStateMachine/BoardStateMachineUtils';
import { MenuContainer, MenuItem, SubMenuButton } from '../../common';
import type { Tool, ShapeType } from '../../../interfaces';

import { toolOptions, shapeOptions } from './options';
import styles from './ToolsMenu.module.scss';

interface ToolsMenu {
    className?: string;
}

const ToolsMenu = ({ className = '' }: ToolsMenu): React.ReactElement => {
    const dispatch = useDispatch();
    const { selectedTool, selectedShapeType } = useSelector((s) => s.tools);

    const handleToolSelect = (tool: Tool) => {
        if (selectedTool !== tool) dispatch(setSelectedTool(tool));
        else dispatch(setSelectedTool('POINTER'));
        dispatch(setCurrentAction('IDLE'));
        selectItems();
    };

    const handleShapeSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
        const shape = e.currentTarget.value as ShapeType;
        dispatch(setSelectedTool('SHAPE'));
        if (selectedShapeType !== shape) {
            dispatch(setSelectedShapeType(shape));
        }
    };

    return (
        <MenuContainer className={`${styles.toolsMenu} ${className}`}>
            {toolOptions.map(([toolIcon, tool]) => (
                <MenuItem
                    key={tool}
                    type={tool === 'SHAPE' ? 'sub' : 'button'}
                    direction="right"
                    iconName={toolIcon}
                    onClick={tool === 'SHAPE' ? undefined : () => handleToolSelect(tool)}
                    selected={selectedTool === tool}
                >
                    {tool === 'SHAPE' && (
                        <div className={styles.shapesMenu}>
                            {shapeOptions.map(([shapeIcon, shape]) => (
                                <SubMenuButton
                                    iconName={shapeIcon}
                                    key={shape}
                                    value={shape}
                                    onClick={handleShapeSelect}
                                    selected={selectedShapeType === shape && selectedTool === 'SHAPE'}
                                />
                            ))}
                        </div>
                    )}
                </MenuItem>
            ))}
        </MenuContainer>
    );
};

export default ToolsMenu;
