/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { createContext } from 'react';
import {
  FcrBoardTool,
  FcrBoardShape,
  BoardConnectionState,
} from '../../../common/whiteboard-wrapper/type';

export interface DraggableHandler {
  getPosition(): { x: number; y: number };
  getSize(): { width: number; height: number };
  updatePosition(position: { x: number; y: number }): void;
  updateSize(size: { width: string | number; height: string | number }): void;
}

const boardUIContextDefault = {
  observables: {
    canOperate: false,
    minimized: false,
    connectionState: BoardConnectionState.Disconnected,
    joinSuccessed: false,
  },
  handleDrop: (e: React.DragEvent) => {},
  handleDragOver: (e: React.DragEvent) => {},
  handleBoardDomLoad: (ref: HTMLDivElement | null) => {},
  handleCollectorDomLoad: (ref: HTMLDivElement | null) => {},
  handleClose: () => {},
  setPrivilege: (canOperate: boolean) => {},
};

const toolbarUIContextDefault = {
  observables: {
    currentTool: undefined as FcrBoardTool | undefined,
    currentShape: undefined as FcrBoardShape | undefined,
    currentColor: '',
    currentStrokeWidth: 0,
    toolbarPosition: { x: 0, y: 0 },
    toolbarReleased: true,
    toolbarDockPosition: {
      x: 0 as number | undefined,
      y: 0 as number | undefined,
      placement: 'left' as 'left' | 'right',
    },
    redoSteps: 0,
    undoSteps: 0,
    lastPen: undefined as FcrBoardShape | undefined,
    lastShape: undefined as FcrBoardShape | undefined,
    maxCountVisibleTools: 4,
    layoutReady: false,
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
  dragToolbar: () => {},
  releaseToolbar: () => {},
  captureApp: () => {},
  captureScreen: () => {},
  saveDraft: () => {},
};

const scenePaginationUIContextDefault = {
  observables: {
    currentPage: 0,
    totalPage: 0,
  },
  addPage: () => {},
  changePage: (page: number) => {},
};

export const BoardUIContext = createContext(boardUIContextDefault);
export type BoardUIContextValue = typeof boardUIContextDefault;

export const ToolbarUIContext = createContext(toolbarUIContextDefault);
export type ToolbarUIContextValue = typeof toolbarUIContextDefault;

export const ScenePaginationUIContext = createContext(scenePaginationUIContextDefault);
export type ScenePaginationUIContextValue = typeof scenePaginationUIContextDefault;
