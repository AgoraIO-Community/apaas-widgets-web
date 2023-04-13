/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { createContext } from 'react';
import { FcrBoardShape, FcrBoardTool } from './wrapper/type';

const boardUIContextDefault = {
  mount: () => {},
  unmount: () => {},
  handleDrop: (e: React.DragEvent) => {},
  handleDragOver: (e: React.DragEvent) => {},
  handleBoardDomLoad: (ref: HTMLDivElement | null) => {},
  handleCollectorDomLoad: (ref: HTMLDivElement | null) => {},
};

const toolbarUIContextDefault = {
  observables: {
    currentTool: undefined as FcrBoardTool | undefined,
    currentShape: undefined as FcrBoardShape | undefined,
    currentColor: '',
    currentStrokeWidth: 0,
    toolbarPosition: { x: 0, y: 0 },
    toolbarReleased: true,
    toolbarDockPosition: { x: 0, y: 0 },
    canRedo: false,
    canUndo: false,
    lastPen: undefined as FcrBoardShape | undefined,
    lastShape: undefined as FcrBoardShape | undefined,
    isMiniSize: true,
  },
  clean: () => {},
  redo: () => {},
  undo: () => {},
  setTool: (tool: FcrBoardTool) => {},
  setPen: (shape: FcrBoardShape) => {},
  setShape: (shape: FcrBoardShape) => {},
  setStrokeColor: (color: string) => {},
  setStrokeWidth: (strokeWidth: number) => {},
  clickExpansionTool: (tool: string) => {},
  setToolbarPosition: (pos: { x: number; y: number }) => {},
  setToolbarDockPosition: (pos: { x: number; y: number }) => {},
  dragToolbar: () => {},
  releaseToolbar: () => {},
  captureApp: () => {},
  captureScreen: () => {},
  saveDraft: () => {},
};

const scenePaginationUIContextDefault = {
  observables: {
    visible: true,
  },
  show: () => {},
  hide: () => {},
};

export const BoardUIContext = createContext(boardUIContextDefault);

export const ToolbarUIContext = createContext(toolbarUIContextDefault);
export type ToolbarUIObservables = typeof toolbarUIContextDefault['observables'];

export const ScenePaginationUIContext = createContext(scenePaginationUIContextDefault);
export type ScenePaginationUIObservables = typeof scenePaginationUIContextDefault['observables'];
