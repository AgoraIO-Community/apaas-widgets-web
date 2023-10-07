import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import classnames from 'classnames';
import { FC, PropsWithChildren, useEffect, useRef, useState } from 'react';
import './index.css';
import { FcrUISceneWidget } from 'agora-common-libs';
import { observer } from 'mobx-react';
import { AgoraExtensionWidgetEvent } from '../../../../../events';
import { addResource } from '../i18n/config';
addResource();

const handleMouseDown = (e: React.MouseEvent) => {
  e.stopPropagation();
};
export type EduToolDialogProps = {
  widget: FcrUISceneWidget;
  showClose?: boolean;
  closeProps?: { tooltipContent?: string; disabled?: boolean };
  showMinimize?: boolean;
  minimizeProps?: { tooltipContent?: string; disabled?: boolean };
};
export const EduToolDialog: FC<PropsWithChildren<EduToolDialogProps>> = observer((props) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    widget,
    showClose = true,
    closeProps = {
      tooltipContent: '',
      disabled: false,
    },
    showMinimize = true,
    minimizeProps = {
      tooltipContent: '',
      disabled: false,
    },
  } = props;
  const handleMinimizedChanged = ({
    widgetId,
    minimized,
  }: {
    minimized: boolean;
    widgetId: string;
  }) => {
    if (widget.widgetId === widgetId) {
      setIsMinimized(minimized);
    }
  };
  useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver(() => {
        if (!isMinimized) {
          widget.updateSize({
            width: containerRef.current?.clientWidth ?? 0,
            height: containerRef.current?.clientHeight ?? 0,
          });
        }
      });
      observer.observe(containerRef.current);
      return () => {
        observer.disconnect();
      };
    }
  }, [isMinimized]);
  useEffect(() => {
    widget.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.SetMinimize,
      onMessage: handleMinimizedChanged,
    });
    return () => {
      widget.removeBroadcastListener({
        messageType: AgoraExtensionWidgetEvent.SetMinimize,
        onMessage: handleMinimizedChanged,
      });
    };
  }, []);
  const handleClose = () => {
    widget.widgetController.broadcast(
      AgoraExtensionWidgetEvent.WidgetBecomeInactive,
      widget.widgetId,
    );

    widget.deleteWidget();
  };
  const handleMinimized = () => {
    widget.setMinimize(true, widget.minimizedProperties);
  };
  return (
    <div className="fcr-edu-tool-dialog">
      <div className="fcr-edu-tool-dialog-actions">
        {showMinimize && (
          <ToolTip content={minimizeProps.tooltipContent}>
            <div
              onClick={(e) => {
                !minimizeProps.disabled && handleMinimized();
              }}
              onMouseDown={handleMouseDown}
              className={classnames('fcr-edu-tool-dialog-action-icon', {
                'fcr-edu-tool-dialog-action-icon-disable': minimizeProps.disabled,
              })}>
              <SvgImg
                type={SvgIconEnum.FCR_MINUS}
                size={14}
                colors={{ iconPrimary: 'currentColor' }}></SvgImg>
            </div>
          </ToolTip>
        )}
        {showClose && (
          <ToolTip content={closeProps.tooltipContent}>
            <div
              onClick={(e) => {
                !closeProps.disabled && handleClose();
              }}
              onMouseDown={handleMouseDown}
              className={classnames('fcr-edu-tool-dialog-action-icon', {
                'fcr-edu-tool-dialog-action-icon-disable': closeProps.disabled,
              })}>
              <SvgImg
                type={SvgIconEnum.FCR_CLOSE}
                size={14}
                colors={{ iconPrimary: 'currentColor' }}></SvgImg>
            </div>
          </ToolTip>
        )}
      </div>
      <div ref={containerRef}>{props.children}</div>
    </div>
  );
});
