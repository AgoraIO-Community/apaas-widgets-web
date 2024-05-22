import React, { useContext, useEffect } from 'react';
import { BoardUIContext } from './ui-context';
import './style.css';
import { Toolbar } from './toolbar';
import { ScenePagination } from './scene-pagination';
import { observer } from 'mobx-react';
import { BoardConnectionState } from '../../../common/whiteboard-wrapper/type';
import { Loading } from './loading';
import { useStore } from '../../../../../agora-classroom-sdk/src/hooks/ui-store';

export const App = observer(() => {
  const {
    observables: { canOperate, connectionState, joinSuccessed },
    observables,
    handleDragOver,
    handleDrop,
    handleBoardDomLoad,
    handleCollectorDomLoad,
  } = useContext(BoardUIContext);
  // const {
  //   shareUIStore: { isLandscape, forceLandscape, toastQueue, addSingletonToast, addToast },
  // } = useStore();
  console.log('observables', observables, canOperate);
  const loading =
    connectionState === BoardConnectionState.Connecting ||
    connectionState === BoardConnectionState.Reconnecting;

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
      {canOperate && <Toolbar />}
      {canOperate && <ScenePagination />}
      {loading && <Loading></Loading>}
    </React.Fragment>
  );
});
