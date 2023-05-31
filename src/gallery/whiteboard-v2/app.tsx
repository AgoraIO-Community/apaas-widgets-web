import React, { FC, PropsWithChildren, useContext, useEffect, useRef } from 'react';
import './style.css';
import { Toolbar } from './toolbar';
import { ScenePagination } from './scene-pagination';
import { BoardUIContext } from './ui-context';
import { observer } from 'mobx-react';
import { Rnd } from 'react-rnd';
import { SvgImg } from '@components/svg-img';
import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import classNames from 'classnames';
import { WINDOW_ASPECT_RATIO, WINDOW_DEFAULT_POSITION, WINDOW_TITLE_HEIGHT } from './utils';
import { useMinimize } from '@ui-kit-utils/hooks/animations';

export const App = observer(() => {
  const {
    observables: { canOperate },
    handleDragOver,
    handleDrop,
    handleBoardDomLoad,
    handleCollectorDomLoad,
  } = useContext(BoardUIContext);

  return (
    <DraggableWindow>
      <>
        <div
          className="board-widget-app"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          ref={handleBoardDomLoad}
        />
        <div
          className="window-manager-collector"
          ref={(ref) => {
            handleCollectorDomLoad(ref);
          }}
        />
        {/* toolbar */}
        {canOperate && <Toolbar />}
        {/* scene pages  */}
        {canOperate && <ScenePagination />}
      </>
    </DraggableWindow>
  );
});

export const DraggableWindow: FC<PropsWithChildren> = observer(({ children }) => {
  // const bounds = 'parent';
  const dragHandle = 'fcr-board-window-drag-handle';
  const dragCancel = 'fcr-board-window-drag-cancel';
  const minWidth = 653;
  const minHeight = 336;
  const resizeHandleStyleOverride = { zIndex: 999 };

  const rndInstance = useRef<Rnd>(null);

  const {
    handleClose,
    handleFitToContainer,
    handleMinimize,
    handleDraggableDomLoad,
    observables: { minimized, fitted },
  } = useContext(BoardUIContext);

  useEffect(() => {
    handleDraggableDomLoad({
      getPosition() {
        if (!rndInstance.current) {
          throw new Error('rnd instance is not available');
        }
        return rndInstance.current.getDraggablePosition();
      },
      getSize() {
        if (!rndInstance.current) {
          throw new Error('rnd instance is not available');
        }

        const ele = rndInstance.current.getSelfElement();

        if (!ele) {
          throw new Error('rnd ele is not available');
        }

        return { width: ele.clientWidth, height: ele.clientHeight };
      },
      updatePosition(position) {
        if (!rndInstance.current) {
          throw new Error('rnd instance is not available');
        }
        rndInstance.current.updatePosition(position);
      },
      updateSize(size) {
        if (!rndInstance.current) {
          throw new Error('rnd instance is not available');
        }

        rndInstance.current.updateSize(size);
      },
    });

    return () => {
      handleDraggableDomLoad(null);
    };
  }, []);

  const { style: miniStyle, ref: miniRef } = useMinimize(minimized);

  const clsn = classNames('fcr-board-draggable-window');
  return (
    <Rnd
      ref={rndInstance}
      dragHandleClassName={dragHandle}
      cancel={`.${dragCancel}`}
      // bounds={bounds}
      minWidth={minWidth}
      minHeight={minHeight}
      default={{
        width: minWidth,
        height: minHeight,
        x: WINDOW_DEFAULT_POSITION.x,
        y: WINDOW_DEFAULT_POSITION.y,
      }}
      lockAspectRatio={WINDOW_ASPECT_RATIO}
      lockAspectRatioExtraHeight={WINDOW_TITLE_HEIGHT}
      resizeHandleStyles={{
        bottom: resizeHandleStyleOverride,
        bottomLeft: resizeHandleStyleOverride,
        bottomRight: resizeHandleStyleOverride,
        left: resizeHandleStyleOverride,
        right: resizeHandleStyleOverride,
        top: resizeHandleStyleOverride,
        topLeft: resizeHandleStyleOverride,
        topRight: resizeHandleStyleOverride,
      }}>
      <div className={clsn} ref={miniRef} style={miniStyle}>
        <div className={`fcr-board-window-title-bar ${dragHandle}`}>
          <span>Whiteboard</span>
          <div className={`fcr-board-window-title-actions ${dragCancel}`}>
            <ul>
              <li>
                <ToolTip content="Minimization">
                  <SvgImg
                    type={SvgIconEnum.FCR_WINDOWPAGE_SMALLER}
                    size={22}
                    onClick={() => handleMinimize()}
                  />
                </ToolTip>
              </li>
              <li>
                <ToolTip content="Attach the window to the presentation viewport">
                  <SvgImg
                    type={
                      fitted
                        ? SvgIconEnum.FCR_WINDOWPAGE_SMALLER3
                        : SvgIconEnum.FCR_WINDOWPAGE_SMALLER2
                    }
                    size={22}
                    onClick={handleFitToContainer}
                  />
                </ToolTip>
              </li>
              <li>
                <ToolTip content="Close">
                  <SvgImg type={SvgIconEnum.FCR_CLOSE} size={14.4} onClick={handleClose} />
                </ToolTip>
              </li>
            </ul>
          </div>
        </div>
        <div className={`fcr-board-window-content ${dragCancel}`}>{children}</div>
      </div>
    </Rnd>
  );
});
