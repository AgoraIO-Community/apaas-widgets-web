/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { createContext } from 'react';

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
    visible: true,
  },
  show: () => {},
  hide: () => {},
});

export const ScenePaginationUIContext = createContext({
  observables: {
    visible: true,
  },
  show: () => {},
  hide: () => {},
});
