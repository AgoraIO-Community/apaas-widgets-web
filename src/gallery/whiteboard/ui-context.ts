/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { createContext } from 'react';
import { FcrBoardShape, FcrBoardTool } from './wrapper/type';

export const BoardUIContext = createContext({
  mount: () => {},
  unmount: () => {},
  handleDrop: (e: React.DragEvent) => {},
  handleDragOver: (e: React.DragEvent) => {},
  handleBoardDomLoad: (ref: HTMLDivElement | null) => {},
  handleCollectorDomLoad: (ref: HTMLDivElement | null) => {},
});

export const ToolbarUIContext = createContext({
  observables: {
    currentTool: FcrBoardTool.Clicker,
    currentColor: '',
    currentShape: FcrBoardShape.Straight,
    toolbarPosition: { x: 0, y: 0 },
    toolbarReleased: true,
    toolbarDockPosition: { x: 0, y: 0 },
  },
  redo: () => {},
  undo: () => {},
  setTool: () => {},
  setShape: () => {},
  setStrokeColor: () => {},
  setStrokeWith: () => {},
  clickExpansionTool: () => {},
  setToolbarPosition: (pos: { x: number; y: number }) => {},
  setToolbarDockPosition: (pos: { x: number; y: number }) => {},
  dragToolbar: () => {},
  releaseToolbar: () => {},
});

export const ScenePaginationUIContext = createContext({
  observables: {
    visible: true,
  },
  show: () => {},
  hide: () => {},
});
