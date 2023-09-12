import { observer } from 'mobx-react';
import { PropsWithChildren, forwardRef, useEffect, useRef, useState } from 'react';
import { FcrUISceneWidget, useI18n } from 'agora-common-libs';
import { ToolTip } from '@components/tooltip';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import './index.css';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../../../events';
import { FcrBoardWidget } from '../../../whiteboard';
import { addResource } from '../i18n/config';
addResource();
interface MultiWindowWidgetDialogProps extends PropsWithChildren {
  widget: FcrUISceneWidget;
  fullscreenable?: boolean;
  closeable?: boolean;
  refreshable?: boolean;
  minimizable?: boolean;
  onRefresh?: () => void;
}

export const MultiWindowWidgetDialog = observer(
  forwardRef<HTMLDivElement, PropsWithChildren<MultiWindowWidgetDialogProps>>(function W(
    { children, widget, fullscreenable, closeable, refreshable, minimizable, onRefresh },
    ref,
  ) {
    const [fullscreen, setFullscreen] = useState(widget.defaultFullscreen);
    const refreshRef = useRef<HTMLLIElement>(null);

    const transI18n = useI18n();

    const handleClose = () => {
      if (widget instanceof FcrBoardWidget) {
        widget.setInactive();
        // close the widget locally
        widget.widgetController.broadcast(AgoraExtensionWidgetEvent.WidgetBecomeInactive, {
          widgetId: widget.widgetId,
        });
      } else {
        widget.widgetController.broadcast(
          AgoraExtensionWidgetEvent.WidgetBecomeInactive,
          widget.widgetId,
        );

        widget.deleteWidget();
      }
    };
    const handleMinimize = () => {
      widget.setMinimize(true, widget.minimizedProperties);
    };
    const handleFullscreen = () => {
      widget.setFullscreen(!fullscreen);
    };
    const handleFullscreenChanged = ({
      widgetId,
      fullscreen,
    }: {
      widgetId: string;
      fullscreen: boolean;
    }) => {
      if (widgetId === widget.widgetId) {
        setFullscreen(fullscreen);
      }
    };

    useEffect(() => {
      widget.addBroadcastListener({
        messageType: AgoraExtensionRoomEvent.SetFullscreen,
        onMessage: handleFullscreenChanged,
      });
      return () => {
        widget.removeBroadcastListener({
          messageType: AgoraExtensionRoomEvent.SetFullscreen,
          onMessage: handleFullscreenChanged,
        });
      };
    }, []);
    return (
      <div ref={ref} className="fcr-widget-dialog-zindex-wrapper fcr-widget-dialog">
        <div className={`fcr-widget-dialog-title-bar`}>
          <span>{widget.displayName || widget.widgetName}</span>
          <div className={`fcr-widget-dialog-title-actions`}>
            <ul>
              {refreshable && (
                <ToolTip content={transI18n('fcr_widget_refresh')}>
                  <li
                    className="fcr-widget-dialog-title-action-refresh"
                    ref={refreshRef}
                    onClick={() => {
                      const aniApi = refreshRef.current?.animate(
                        {
                          transform: ['rotate(0deg)', 'rotate(360deg)'],
                        },
                        { duration: 500 },
                      );
                      aniApi?.play();
                      onRefresh?.();
                    }}>
                    <SvgImg type={SvgIconEnum.FCR_RESET} size={16} />
                  </li>
                </ToolTip>
              )}
              {minimizable && (
                <ToolTip content={transI18n('fcr_widget_minimization')}>
                  <li className="fcr-widget-dialog-title-action-minimize" onClick={handleMinimize}>
                    <SvgImg type={SvgIconEnum.FCR_WINDOWPAGE_SMALLER} size={16} />
                  </li>
                </ToolTip>
              )}
              {fullscreenable && (
                <ToolTip
                  overlayInnerStyle={{ whiteSpace: 'nowrap' }}
                  placement={'top'}
                  content={
                    fullscreen
                      ? transI18n('fcr_widget_exit_adaptation')
                      : transI18n('fcr_widget_adapt_to_viewport')
                  }>
                  <li
                    className="fcr-widget-dialog-title-action-fullscreen"
                    onClick={handleFullscreen}>
                    <SvgImg
                      type={
                        fullscreen
                          ? SvgIconEnum.FCR_WINDOWPAGE_SMALLER3
                          : SvgIconEnum.FCR_WINDOWPAGE_SMALLER2
                      }
                      size={16}
                    />
                  </li>
                </ToolTip>
              )}

              {closeable && (
                <ToolTip content={transI18n('fcr_widget_close')}>
                  <li className="fcr-widget-dialog-title-action-close" onClick={handleClose}>
                    <SvgImg type={SvgIconEnum.FCR_CLOSE} size={12} />
                  </li>
                </ToolTip>
              )}
            </ul>
          </div>
        </div>
        <div className={`fcr-widget-dialog-content `}>{children}</div>
      </div>
    );
  }),
);
