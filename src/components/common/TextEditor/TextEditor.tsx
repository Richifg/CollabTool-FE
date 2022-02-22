import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getItemPositionCSSVars, getTextAreaCoordinates, isTextItem } from '../../../utils';
import { useSelector, useDispatch } from '../../../hooks';
import { addItem } from '../../../store/slices/itemsSlice';
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

    // ## TODO: important, save text on a debounced onChange (right now text is lost if style is edited after writing)
    useEffect(() => {
        // set flag so canvas stops rendering the same text as the text editor
        if (isWriting && isTextItem(selectedItem) && selectedItem.text) {
            dispatch(addItem({ ...selectedItem, text: { ...selectedItem.text, skipRendering: true } }));
        }
        // saves item's new text when no longer writing
        const lastItem = lastSelectedItemRef.current;
        if (!isWriting && isTextItem(lastItem)) {
            // clean html from textbox
            const content = htmlText.replace(/\<br\/?\>/g, '/n').replace(/\&nbsp;/g, ' ');
            let newItem: BoardItem;
            if (lastItem.text) newItem = { ...lastItem, text: { ...lastItem.text, content } };
            else newItem = { ...lastItem, text: { ...textStyle, content } };
            delete newItem.text?.skipRendering;
            dispatch(addItem(newItem));
        }
    }, [isWriting]);

    // updates initial display text when selecting a new item
    useEffect(() => {
        if (selectedItem && 'text' in selectedItem) {
            const text = selectedItem?.text?.content || '';
            const htmlText = text.replaceAll(/\/n/g, '<br/>');
            setInitText(htmlText);
            setHtmlText(htmlText);
            lastSelectedItemRef.current = selectedItem;
        }
    }, [selectedItem]);

    // css style vars for texteditor
    const [color, font, textAlign, verticalAlign]: [string, string, Align, string] = useMemo(() => {
        const source = (isTextItem(selectedItem) && selectedItem?.text) || textStyle;
        const { color, fontSize, fontFamily, hAlign, vAlign, bold, italic } = source;
        const verticalAlign = vAlign == 'start' ? ' top' : vAlign == 'end' ? 'bottom' : 'middle';
        const font = `${italic ? 'italic' : 'normal'} ${bold ? 'bold' : 'normal'} ${fontSize}px ${fontFamily}`;
        return [color, font, hAlign, verticalAlign];
    }, [selectedItem, textStyle]);

    // css position vars for texteditor
    const { left, top, width, height } = useMemo(() => {
        if (!selectedItem) return { left: 0, top: 0, width: 0, height: 0 };
        const { type } = selectedItem;
        if (type === 'shape' || type === 'note') {
            const coordinates = getTextAreaCoordinates(selectedItem);
            return getItemPositionCSSVars(canvasTransform, coordinates);
        } else {
            const { x0, y0, x2, y2 } = selectedItem;
            return getItemPositionCSSVars(canvasTransform, { x0, y0, x2, y2 });
        }
    }, [canvasTransform, selectedItem]);

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
                className="text-box"
                style={{ color, font, textAlign, verticalAlign, width }}
                contentEditable
                dangerouslySetInnerHTML={{ __html: initText }}
                onInput={handleChange}
            />
        </div>
    );
};

export default TextEditor;
