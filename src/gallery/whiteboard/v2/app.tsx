import React, { useContext, useEffect } from 'react';
import { BoardUIContext } from '../ui-context';
import './style.css';
import { Toolbar } from './toolbar';
import { ScenePagination } from './scene-pagination';

export const App = () => {
  const { mount, unmount, handleDragOver, handleDrop, handleBoardDomLoad, handleCollectorDomLoad } =
    useContext(BoardUIContext);

  useEffect(() => {
    mount();
    return () => {
      unmount();
    };
  }, []);

  return (
    <React.Fragment>
      <div
        className="board-widget-app"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        ref={(ref) => {
          handleBoardDomLoad(ref);
        }}
      />
      <div
        className="window-manager-collector"
        ref={(ref) => {
          handleCollectorDomLoad(ref);
        }}
      />
      {/* toolbar */}
      <Toolbar />
      {/* scenes  */}
      <ScenePagination />
      {/*  */}
    </React.Fragment>
  );
};
