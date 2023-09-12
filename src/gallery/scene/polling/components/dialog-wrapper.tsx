import React, { FC } from 'react';
import { AutoSizer } from 'react-virtualized';
import { observer } from 'mobx-react';
type Props = {
  children: React.ReactNode;
};

export const DialogWrapper: FC<Props> = observer(({ children }) => {
  // This handler is used for preventing z-index updating and that may unexpectedly reopen widget

  return (
    <>
      <AutoSizer>
        {() => <div className="fcr-w-full fcr-h-full fcr-absolute" style={{ zIndex: -1 }} />}
      </AutoSizer>
      {children}
    </>
  );
});
