import React, { useContext, useEffect } from 'react';
import { BoardUIContext } from './ui-context';
import './style.css';
import { Toolbar } from './toolbar';
import { BoardConnectionState } from '../../../common/whiteboard-wrapper/type';

export const App = () => {
  const { handleDragOver, handleDrop, handleBoardDomLoad, handleCollectorDomLoad } =
    useContext(BoardUIContext);

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

      <div id="fcr_board_center_position" className="fcr_board_center_position" />
      {/* toolbar */}
      <Toolbar />
    </React.Fragment>
  );
};
