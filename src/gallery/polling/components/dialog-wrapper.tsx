import { WidgetDialog } from '@components/dialog';
import { SvgIconEnum } from '@components/svg-img';
import React, { FC, useCallback, useRef } from 'react';
import { AutoSizer } from 'react-virtualized';

type Props = {
  canClose: boolean;
  onResize: ({ width, height }: { width: number; height: number }, initial: boolean) => void;
  onClose: () => void;
  onMinimize: () => void;
  children: React.ReactNode;
};

export const DialogWrapper: FC<Props> = ({ onResize, onClose, onMinimize, children, canClose }) => {
  const resizeTimes = useRef(0);
  const handleResize = useCallback(
    (dimensions: { width: number; height: number }) => {
      if (onResize) {
        onResize(dimensions, resizeTimes.current === 0);
      }
      resizeTimes.current += 1;
    },
    [onResize],
  );
  // This handler is used for preventing z-index updating and that may unexpectedly reopen widget
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  const actions = [
    {
      icon: SvgIconEnum.FCR_MINUS,
      onClick: onMinimize,
      onMouseDown: handleMouseDown,
    },
  ];
  if (canClose) {
    actions.push({
      icon: SvgIconEnum.FCR_CLOSE,
      onClick: onClose,
      onMouseDown: handleMouseDown,
    });
  }
  return (
    <WidgetDialog actions={actions} className="fcr-relative fcr-w-full fcr-h-full">
      <AutoSizer onResize={handleResize}>
        {() => <div className="fcr-w-full fcr-h-full fcr-absolute" style={{ zIndex: -1 }} />}
      </AutoSizer>
      {children}
    </WidgetDialog>
  );
};
