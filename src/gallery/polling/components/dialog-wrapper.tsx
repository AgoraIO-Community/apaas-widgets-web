import React, { FC, useCallback, useContext, useRef } from 'react';
import { AutoSizer } from 'react-virtualized';
import { PollingUIContext } from '../ui-context';
import { observer } from 'mobx-react';
type Props = {
  children: React.ReactNode;
};

export const DialogWrapper: FC<Props> = observer(({ children }) => {
  const resizeTimes = useRef(0);

  const { onResize } = useContext(PollingUIContext);
  const handleResize = useCallback(
    (dimensions: { width: number; height: number }) => {
      if (onResize) {
        onResize(dimensions);
      }
      resizeTimes.current += 1;
    },
    [onResize],
  );
  // This handler is used for preventing z-index updating and that may unexpectedly reopen widget

  return (
    <>
      <AutoSizer onResize={handleResize}>
        {() => <div className="fcr-w-full fcr-h-full fcr-absolute" style={{ zIndex: -1 }} />}
      </AutoSizer>
      {children}
    </>
  );
});
