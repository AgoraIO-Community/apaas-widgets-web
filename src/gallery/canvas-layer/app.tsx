import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { FcrCanvasLayerWidget } from '.';
import './index.css';
import { ThemeProvider } from 'agora-common-libs';
import { WidgetModal } from '../../components/modal';
import { FcrBoardShape, FcrBoardTool } from 'agora-classroom-sdk';

export const App = observer(({ widget }: { widget: FcrCanvasLayerWidget }) => {
  const [allowDrawing, setAllowDrawing] = useState(false);
  useEffect(() => {
    widget.mount();

    return () => {
      widget.unmount();
    };
  }, []);

  return (
    <ThemeProvider value={widget.theme}>
      <WidgetModal title={'Canvas'} closable onCancel={widget.handleClose}>
        <div className="relative w-full h-full canvas-layer">
          {widget.hasPrivilege ? (
            <div className="absolute top-0 right-0 z-10 gap-2 flex">
              <button
                onClick={() => {
                  setAllowDrawing(!allowDrawing);
                }}>
                {!allowDrawing ? 'Allow drawing' : 'Disallow drawing'}
              </button>
              <button
                onClick={() => {
                  widget.handleSelectShape(FcrBoardShape.Curve);
                }}>
                Pen
              </button>
              <button
                onClick={() => {
                  widget.handleSelectTool(FcrBoardTool.Eraser);
                }}>
                Eraser
              </button>
            </div>
          ) : null}

          <div>
            <div>Count: {widget.counter}</div>
            <button onClick={() => widget.handleCountIncrement()}>
              {allowDrawing ? 'Cannot click me' : 'Click me to count'}
            </button>
          </div>
          <div
            className={allowDrawing ? '' : 'disallow-drawing'}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            ref={(ref) => {
              widget.boardDom = ref;
              if (ref) {
                const observer = new ResizeObserver(() => {
                  widget.handleBoardContentResize({
                    width: ref.clientWidth,
                    height: ref.clientHeight,
                  });
                });
                observer.observe(ref);
              }
            }}
          />
        </div>
      </WidgetModal>
    </ThemeProvider>
  );
});
