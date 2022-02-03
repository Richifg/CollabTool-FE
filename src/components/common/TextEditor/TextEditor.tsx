import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getItemPositionCSSVars } from '../../../utils';
import { useSelector, useDispatch } from '../../../hooks';
import { addUserItem } from '../../../store/slices/itemsSlice';
import { Align, BoardItem } from '../../../interfaces';

import './TextEditor.scss';

// ##TODO maybe should return earlier when no item is selected to avoid all position calculations when moving canvas around
const TextEditor = (): React.ReactElement => {
    const dispatch = useDispatch();
    const { canvasTransform, isWriting } = useSelector((s) => s.board);
    const { textStyle } = useSelector((s) => s.tools);
    const { selectedItem } = useSelector((s) => s.items);
    const [initText, setInitText] = useState('');
    const [htmlText, setHtmlText] = useState('');
    const textBoxRef = useRef<HTMLDivElement>(null);
    const lastSelectedItemRef = useRef<BoardItem>();

    useEffect(() => {
        // set flag so canvas stops rendering the same text as the text editor
        if (isWriting && selectedItem?.text) {
            dispatch(addUserItem({ ...selectedItem, text: { ...selectedItem.text, skipRendering: true } }));
        }
        // saves item's new text when no longer writing
        if (!isWriting && lastSelectedItemRef.current) {
            const item = lastSelectedItemRef.current;
            // clean html from textbox
            const content = htmlText.replace(/\<br\/?\>/g, '/n').replace(/\&nbsp;/g, ' ');
            let newItem: BoardItem;
            if (item.text) newItem = { ...item, text: { ...item.text, content } };
            else newItem = { ...item, text: { ...textStyle, content } };
            delete newItem.text?.skipRendering;
            dispatch(addUserItem(newItem));
        }
    }, [isWriting]);

    // updates initial display text when selecting a new item
    useEffect(() => {
        const text = selectedItem?.text?.content || '';
        const htmlText = text.replaceAll(/\/n/g, '<br/>');
        setInitText(htmlText);
        setHtmlText(htmlText);
        lastSelectedItemRef.current = selectedItem;
    }, [selectedItem]);

    // css style vars for texteditor
    const [color, font, textAlign, verticalAlign]: [string, string, Align, string] = useMemo(() => {
        const source = selectedItem?.text || textStyle;
        const { color, fontSize, fontFamily, hAlign, vAlign, bold, italic } = source;
        const verticalAlign = vAlign == 'start' ? ' top' : vAlign == 'end' ? 'bottom' : 'middle';
        const font = `${italic ? 'italic' : 'normal'} ${bold ? 'bold' : 'normal'} ${fontSize}px ${fontFamily}`;
        return [color, font, hAlign, verticalAlign];
    }, [selectedItem, textStyle]);

    // css position vars for texteditor
    const { left, top, width, height } = useMemo(
        () => getItemPositionCSSVars(canvasTransform, selectedItem),
        [canvasTransform, selectedItem],
    );

    const handleMouseDown = (e: React.MouseEvent) => e.stopPropagation();

    const handleChange = (e: React.ChangeEvent<HTMLDivElement>) => {
        setHtmlText(e.currentTarget.innerHTML);
    };

    if (!isWriting || !selectedItem) return <></>;

    const { scale } = canvasTransform;
    return (
        <div
            className="text-editor"
            style={{ left, top, width, height, transform: `scale(${scale})` }}
            onMouseDown={handleMouseDown}
        >
            <div
                ref={textBoxRef}
                className="text"
                style={{ color, font, textAlign, verticalAlign, width }}
                contentEditable
                dangerouslySetInnerHTML={{ __html: initText }}
                onInput={handleChange}
            />
        </div>
    );
};

export default TextEditor;
