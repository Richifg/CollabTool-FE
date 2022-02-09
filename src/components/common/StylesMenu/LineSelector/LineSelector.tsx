import React from 'react';
import { ShapeStyle } from '../../../../interfaces';
import './LineSelector.scss';

interface LineSelector {
    value: number;
    onChange(value: number, styleKey: string): void;
    styleKey: keyof ShapeStyle;
}

const LineSelector = ({ onChange, value, styleKey }: LineSelector): React.ReactElement => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.currentTarget.value);
        if (value > 10 || value < 1) return;
        onChange(value, styleKey);
    };

    return (
        <div className="line-selector">
            <input className="line-width-input" type="number" onChange={handleChange} value={value} />
        </div>
    );
};

export default LineSelector;