import React, { useContext, useEffect } from 'react';
import { BoardUIContext, ToolbarUIContext } from './ui-context';
import { runInAction } from 'mobx';
import './style.css';
import { Toolbar } from './toolbar';
import { FcrBoardWidget } from '.';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { debounce } from 'lodash';

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
    }, 100);

    const targetElement = document.querySelector('.streams-swiper-vert');
    let resizeObserver: ResizeObserver | null = null;

    if (targetElement) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const slideWidth = entry.contentRect.width;
          _setToolbarDockPosition(slideWidth);
        }
      });

      resizeObserver.observe(targetElement);
    }

    widget.widgetController.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OrientationStatesChanged,
      onMessage: _handleOrientationChanged,
    });
    widget.widgetController.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.MobileLandscapeToolBarVisibleChanged,
      onMessage: _resetToolPosition,
    });
    return () => {
      targetElement && resizeObserver?.unobserve(targetElement);

      widget.widgetController.removeBroadcastListener({
        messageType: AgoraExtensionRoomEvent.MobileLandscapeToolBarVisibleChanged,
        onMessage: _resetToolPosition,
      });
      widget.widgetController.removeBroadcastListener({
        messageType: AgoraExtensionRoomEvent.OrientationStatesChanged,
        onMessage: _handleOrientationChanged,
      });
    };
  }, []);

  const _resetToolPosition = (bool: boolean) => {
    if (!bool) {
      const containeTop =
        document.querySelector('.netless-whiteboard-wrapper')?.getBoundingClientRect()?.top || 0;
      runInAction(() => {
        observables.toolbarDockPosition.y = containeTop + 12;
      });
    } else {
      const slideWidth = (document.querySelector('.streams-swiper-vert') as HTMLElement)
        ?.offsetWidth;
      _setToolbarDockPosition(slideWidth);
    }
  };

  const _setToolbarDockPosition = debounce((slideWidth) => {
    const targetToolPanel = (document.querySelector('.landscape-tool-panel') as HTMLElement)
      ?.offsetHeight;
    if (slideWidth > 0 && targetToolPanel > 0) {
      runInAction(() => {
        observables.toolbarDockPosition.y = 40 + 12;
      });
    } else if (targetToolPanel > 0) {
      runInAction(() => {
        observables.toolbarDockPosition.y = 40 + 12;
      });
    } else {
      runInAction(() => {
        observables.toolbarDockPosition.y = 12;
      });
    }
  }, 10);

  const handleCloseToolbar = () => {
    widget.widgetController.broadcast(
      AgoraExtensionWidgetEvent.RequestMobileLandscapeToolBarVisible,
      true,
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
      <Toolbar closeToolBar={handleCloseToolbar} widget={widget} />
    </React.Fragment>
  );
};
