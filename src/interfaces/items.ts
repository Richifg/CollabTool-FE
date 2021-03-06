export type Point = 'P0' | 'P1' | 'P2' | 'P3';
export type MainPoint = 'P0' | 'P2';

export type LineConnections = [lineId: string, point: MainPoint, x: number, y: number][];

export type BoardItemType = 'text' | 'shape' | 'note' | 'drawing' | 'line';
export type ItemType = BoardItemType | 'chat';

export interface Coordinates {
    x0: number;
    y0: number;
    x2: number;
    y2: number;
}

interface ItemBase {
    type: ItemType;
    id: string;
    creationDate: number;
}

interface BoardItemBase extends ItemBase, Coordinates {
    type: BoardItemType;
    zIndex: number;
}

export type LinePattern = 0 | 1 | 2 | 3;
export interface StrokeStyle {
    lineColor: string;
    lineWidth: number;
    linePattern: LinePattern;
}

export interface FillStyle {
    fillColor: string;
}

// --TEXT
export type Align = 'start' | 'center' | 'end';
export interface TextStyle {
    fontSize: number;
    fontFamily: string;
    fontColor: string;
    hAlign: Align;
    vAlign: Align;
    italic: boolean;
    bold: boolean;
    skipRendering?: boolean;
}
export interface TextData extends TextStyle {
    content: string;
}
export interface Text extends BoardItemBase {
    type: 'text';
    text: TextData;
    connections?: LineConnections;
}

// --SHAPE
export type ShapeType = 'rect' | 'circle' | 'roundedRect' | 'romboid' | 'triangle' | 'bubble';
export interface ShapeStyle extends StrokeStyle, FillStyle {}
export interface Shape extends BoardItemBase, ShapeStyle {
    type: 'shape';
    shapeType: ShapeType;
    text?: TextData;
    connections?: LineConnections;
}

// --NOTE
export interface NoteStyle extends FillStyle {
    size: number;
    shadowType?: string; // TODO
}
export interface Note extends BoardItemBase, NoteStyle {
    type: 'note';
    text?: TextData;
    connections?: LineConnections;
}

// --DRAWING
export type DrawingStyle = StrokeStyle;
export interface Drawing extends BoardItemBase, DrawingStyle {
    type: 'drawing';
    points: [number, number][];
    connections?: LineConnections;
    isAbsolute?: boolean;
}

// --LINE
export type ArrowType = 'none' | 'simple' | 'triangle' | 'circle';
export type LineType = 'straight' | 'curved' | 'stepped';
export interface LineStyle extends StrokeStyle {
    lineType: LineType;
    arrow0Type: ArrowType;
    arrow2Type: ArrowType;
}
export interface Line extends BoardItemBase, LineStyle {
    type: 'line';
}

// --CHAT
export interface ChatMessage extends ItemBase {
    type: 'chat';
    content: string;
    fromId: string; // need id to fetch updated username from users slice
    fromUsername: string; // need username for when user disconnects (this one doesn't update)
}

// items drawn on the board with coordinates
export type BoardItem = Note | Text | Shape | Drawing | Line;

// BoardItems with text
export type BoardTextItem = Note | Text | Shape;

// general Item type for any item that users can create
export type Item = BoardItem | ChatMessage;
