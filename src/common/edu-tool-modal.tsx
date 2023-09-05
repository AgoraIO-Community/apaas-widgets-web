import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { AgoraEduToolWidget } from './edu-tool-widget';
import { WidgetModal } from '../components/modal';
import { ThemeProvider } from 'agora-common-libs';

export const ControlledModal: FC<
  PropsWithChildren<{
    widget: AgoraEduToolWidget;
    title: string;
    onReload?: () => void;
    onCancel: () => void;
    onFullScreen: () => void;
    canRefresh: boolean;
  }>
> = ({ widget, title, onReload, onCancel, onFullScreen, canRefresh, children }) => {
  const [controlled, setControlled] = useState(() => widget.controlled);
  useEffect(() => {
    const handleChange = () => {
      setControlled(widget.controlled);
    };

    if (widget.addControlStateListener) {
      widget.addControlStateListener(handleChange);
    }

    return () => {
      if (widget.removeControlStateListener) {
        widget.removeControlStateListener(handleChange);
      }
    };
  }, []);

  return (
    <ThemeProvider value={widget.theme}>
      <WidgetModal
        title={title}
        showRefresh={canRefresh}
        showFullscreen={controlled}
        closable={controlled}
        onReload={onReload}
        onCancel={onCancel}
        onFullScreen={onFullScreen}>
        {children}
      </WidgetModal>
    </ThemeProvider>
  );
};
