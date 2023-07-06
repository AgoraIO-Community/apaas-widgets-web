import React, { useContext, useEffect } from 'react';
import { BoardUIContext } from './ui-context';
import './style.css';

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
    </React.Fragment>
  );
};
