import { WidgetDialog } from '@components/dialog';
import { ActionIcon } from '@components/dialog/widget-dialog';
import { SvgIconEnum } from '@components/svg-img';
import React, { FC, useCallback, useContext, useRef } from 'react';
import { AutoSizer } from 'react-virtualized';
import { PollingState } from '../type';
import { PollingUIContext } from '../ui-context';
import { observer } from 'mobx-react';
type Props = {
  canClose: boolean;
  onResize: ({ width, height }: { width: number; height: number }, initial: boolean) => void;
  onClose: () => void;
  onMinimize: () => void;
  children: React.ReactNode;
};

export const DialogWrapper: FC<Props> = observer(
  ({ onResize, onClose, onMinimize, children, canClose }) => {
    const resizeTimes = useRef(0);
    const {
      observables: { pollingState, minimize },
    } = useContext(PollingUIContext);
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
    const closeDisable = pollingState === PollingState.POLLING_END;

    const actions: ActionIcon[] = [
      {
        icon: SvgIconEnum.FCR_MINUS,
        onClick: onMinimize,
        onMouseDown: handleMouseDown,
        tooltipContent: 'Minimization',
      },
    ];
    if (canClose) {
      actions.push({
        icon: SvgIconEnum.FCR_CLOSE,
        onClick: () => {
          setTimeout(() => {
            onClose();
          }, 200);
        },
        onMouseDown: handleMouseDown,
        disable: closeDisable,
        tooltipContent: closeDisable
          ? 'Please end the current round of voting before closing the polls.'
          : 'Close',
      });
    }
    return (
      <WidgetDialog
        width={230}
        actions={actions}
        minimize={minimize}
        dragHandleClassName="fcr-polling-title"
        className="fcr-relative fcr-w-full fcr-h-full">
        <AutoSizer onResize={handleResize}>
          {() => <div className="fcr-w-full fcr-h-full fcr-absolute" style={{ zIndex: -1 }} />}
        </AutoSizer>
        {children}
      </WidgetDialog>
    );
  },
);
