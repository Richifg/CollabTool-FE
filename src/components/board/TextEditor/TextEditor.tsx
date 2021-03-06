import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { getPositionCSSVars, getTextAreaCoordinates, isTextItem } from '../../../utils';
import { useSelector, useDebouncedCallback } from '../../../hooks';
import { BoardItem, BoardTextItem, TextData } from '../../../interfaces';
import { processItemUpdates } from '../../../BoardStateMachine/BoardStateMachineUtils';

import styles from './TextEditor.module.scss';

function processTextUpdate(item: BoardTextItem, data: Partial<TextData>) {
    const updateData = { id: item.id, text: { ...item.text, ...data } };
    processItemUpdates(updateData);
}

const TextEditor = (): React.ReactElement => {
    const { canvasTransform, isWriting } = useSelector((s) => s.board);
    const { textStyle } = useSelector((s) => s.tools);
    const { items, selectedItemIds } = useSelector((s) => s.items);
    const [initText, setInitText] = useState('');
    const textBoxRef = useRef<HTMLDivElement>(null);
    const selectedItem = selectedItemIds.length === 1 ? items[selectedItemIds[0]] : undefined;

    // keep last selected item on ref so it can be used inside debounce callback
    const lastSelectedItemRef = useRef<BoardItem>();
    useEffect(() => {
        lastSelectedItemRef.current = selectedItem;
    }, [selectedItem]);

    // updates initial display text when selected item id changes
    useLayoutEffect(() => {
        if (isTextItem(selectedItem) && selectedItem.text) {
            const text = selectedItem.text.content;
            const htmlText = text.replaceAll(/\/n/g, '<br/>');
            setInitText(htmlText);
        } else {
            setInitText('');
        }
        // also cleanup text from lastSelectedItem if it was a textItem
        const lastItem = lastSelectedItemRef.current;
        if (isTextItem(lastItem) && lastItem.text) {
            // cleans unerasable final enter when writing into content editable html ##TODO theres a bug here
            let content = lastItem.text.content;
            if (content.slice(-2) === '/n') content = content.substring(0, content.length - 2);
            processTextUpdate(lastItem, { content, skipRendering: false });
        }
    }, [selectedItem?.id]);

    // focus texbox and skip item text rendering
    useEffect(() => {
        if (isWriting) {
            textBoxRef.current?.focus();
            if (isTextItem(selectedItem) && selectedItem.text) processTextUpdate(selectedItem, { skipRendering: true });
        }
    }, [isWriting, selectedItem?.id]);

    const handleTextChange = (e: React.ChangeEvent<HTMLDivElement>) => {
        // need a extra handler with actual content so if div is unmounted while debounce timer is going
        // the content from the last call is not lost
        const lastItem = lastSelectedItemRef.current;
        if (lastItem) processTextChange(e.target.innerHTML, lastItem);
    };

    // handles update of item's text
    const processTextChange = useDebouncedCallback(
        (rawContent: string, lastItem: BoardItem) => {
            if (isTextItem(lastItem)) {
                // clean html from textbox
                const content = rawContent
                    .replace(/\<br\/?\>/g, '/n') // line breaks into new line chars
                    .replace(/\&nbsp;/g, ' ') // nbsp's into spaces
                    .replace(/(\<\/?span[^\>]*\>)/g, ''); // remove span tags
                // skipRendering might need to be turned back to false if debounce took longer than deselecting the item
                const skipRendering = lastSelectedItemRef.current?.id === lastItem.id;
                if (lastItem.text) processTextUpdate(lastItem, { content, skipRendering });
                else processTextUpdate({ ...lastItem, text: { ...textStyle, content, skipRendering } }, {});
            }
        },
        200,
        [textStyle],
    );

    // css style vars for texteditor
    const [color, font, textAlign, verticalAlign] = useMemo(() => {
        const source = (isTextItem(selectedItem) && selectedItem?.text) || textStyle;
        const { fontColor, fontSize, fontFamily, hAlign, vAlign, bold, italic } = source;
        const verticalAlign = vAlign == 'start' ? ' top' : vAlign == 'end' ? 'bottom' : 'middle';
        const font = `${italic ? 'italic' : 'normal'} ${bold ? 'bold' : 'normal'} ${fontSize}px ${fontFamily}`;
        return [fontColor, font, hAlign, verticalAlign];
    }, [textStyle, selectedItem]);

    // css position vars for texteditor
    const { left, top, width, height } = useMemo(() => {
        if (!selectedItem) return { left: 0, top: 0, width: 0, height: 0 };
        const { type } = selectedItem;
        if (type === 'shape' || type === 'note') {
            const coordinates = getTextAreaCoordinates(selectedItem);
            return getPositionCSSVars(canvasTransform, coordinates);
        } else {
            const { x0, y0, x2, y2 } = selectedItem;
            return getPositionCSSVars(canvasTransform, { x0, y0, x2, y2 });
        }
    }, [canvasTransform, selectedItem]);

    // avoid dragging element when text editor is opened (text editor covers element)
    const handleMouseDown = (e: React.MouseEvent) => e.stopPropagation();

    if (!isWriting || !isTextItem(selectedItem)) return <></>;
    const { scale } = canvasTransform;
    return (
        <div
            className={styles.textEditor}
            style={{ left, top, width, height, transform: `scale(${scale})` }}
            onPointerDown={handleMouseDown}
        >
            <div
                ref={textBoxRef}
                className={styles.textBox}
                style={{ color, font, textAlign, verticalAlign, width }}
                contentEditable
                dangerouslySetInnerHTML={{ __html: initText }}
                onInput={handleTextChange}
            />
        </div>
    );
};

export default TextEditor;
