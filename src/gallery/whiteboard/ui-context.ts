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
  },
  redo: () => {},
  undo: () => {},
  setTool: () => {},
  setShape: () => {},
  setStrokeColor: () => {},
  setStrokeWith: () => {},
  clickExpansionTool: () => {},
});

export const ScenePaginationUIContext = createContext({
  observables: {
    visible: true,
  },
  show: () => {},
  hide: () => {},
});
