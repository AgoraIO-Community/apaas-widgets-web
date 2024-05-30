import React, { useContext, useEffect } from 'react';
import { BoardUIContext, ToolbarUIContext } from './ui-context';
import { runInAction } from 'mobx';
import './style.css';
import { Toolbar } from './toolbar';
import { FcrBoardWidget } from '.';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';

export const App = ({ widget }: { widget: FcrBoardWidget }) => {
  const { setLandscape, handleDragOver, handleDrop, handleBoardDomLoad, handleCollectorDomLoad } =
    useContext(BoardUIContext);
  const { observables } = useContext(ToolbarUIContext);

  const _handleOrientationChanged = (params: any) => {
    runInAction(() => {
      observables.fixedBottomBarVisible = false;
      observables.foldToolBar = true;
      setLandscape(params.orientation === 'landscape' || params.forceLandscape);
    });
  };

  useEffect(() => {
    setTimeout(() => {
      widget.widgetController.broadcast(
        AgoraExtensionRoomEvent.OrientationStatesChangedAgain,
        true,
      );
    }, 200);

    widget.widgetController.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OrientationStatesChanged,
      onMessage: _handleOrientationChanged,
    });
    return () => {
      widget.widgetController.removeBroadcastListener({
        messageType: AgoraExtensionRoomEvent.OrientationStatesChanged,
        onMessage: _handleOrientationChanged,
      });
    };
  }, []);

  const handleCloseToolbar = () => {
    widget.widgetController.broadcast(
      AgoraExtensionWidgetEvent.RequestMobileLandscapeToolBarVisible,
      undefined,
    );
  };

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
      <Toolbar closeToolBar={handleCloseToolbar} />
    </React.Fragment>
  );
};
