import React, { useEffect, useRef, forwardRef } from 'react';
import { observer } from 'mobx-react';
import { FcrWebviewWidget } from '.';

export type WebviewInterface = {
  refresh: () => void;
};

export const Webview = forwardRef<WebviewInterface, { url: string }>(function W(
  { url }: { url: string },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  React.useImperativeHandle(ref, () => ({
    refresh() {
      if (iframeRef.current) {
        iframeRef.current.src = url;
      }
    },
  }));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <iframe ref={iframeRef} src={url} style={{ width: '100%', height: '100%' }}></iframe>
    </div>
  );
});

export const App = observer(({ widget }: { widget: FcrWebviewWidget }) => {
  const webviewRef = React.useRef<WebviewInterface>(null);

  return <Webview ref={webviewRef} url={widget.webviewUrl ?? ''} />;
});
