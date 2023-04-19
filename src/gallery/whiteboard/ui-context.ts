/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { createContext } from 'react';

const boardUIContextDefault = {
  mount: () => {},
  unmount: () => {},
  handleDrop: (e: React.DragEvent) => {},
  handleDragOver: (e: React.DragEvent) => {},
  handleBoardDomLoad: (ref: HTMLDivElement | null) => {},
  handleCollectorDomLoad: (ref: HTMLDivElement | null) => {},
};

export const BoardUIContext = createContext(boardUIContextDefault);
