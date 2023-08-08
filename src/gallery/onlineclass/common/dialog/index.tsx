import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import classnames from 'classnames';
import { FC, PropsWithChildren } from 'react';
import './index.css';
const handleMouseDown = (e: React.MouseEvent) => {
  e.stopPropagation();
};
export type EduToolDialogProps = {
  showMinus?: boolean;
  minusProps?: {
    tooltipContent?: string;
    disabled?: boolean;
  };
  onMinusClick?: (e: React.MouseEvent) => void;
  showClose?: boolean;
  closeProps?: { tooltipContent?: string; disabled?: boolean };
  onCloseClick?: (e: React.MouseEvent) => void;
};
export const EduToolDialog: FC<PropsWithChildren<EduToolDialogProps>> = (props) => {
  const { showMinus = false, showClose = false } = props;
  return (
    <div className="fcr-edu-tool-dialog">
      <div className="fcr-edu-tool-dialog-actions">
        {showMinus && (
          <ToolTip content={props.minusProps?.tooltipContent}>
            <div
              onClick={(e) => {
                !props.minusProps?.disabled && props.onMinusClick?.(e);
              }}
              onMouseDown={handleMouseDown}
              className={classnames('fcr-edu-tool-dialog-action-icon', {
                'fcr-edu-tool-dialog-action-icon-disable': props.minusProps?.disabled,
              })}>
              <SvgImg
                type={SvgIconEnum.FCR_MINUS}
                size={14}
                colors={{ iconPrimary: 'currentColor' }}></SvgImg>
            </div>
          </ToolTip>
        )}
        {showClose && (
          <ToolTip content={props.closeProps?.tooltipContent}>
            <div
              onClick={(e) => {
                !props.closeProps?.disabled && props.onCloseClick?.(e);
              }}
              onMouseDown={handleMouseDown}
              className={classnames('fcr-edu-tool-dialog-action-icon', {
                'fcr-edu-tool-dialog-action-icon-disable': props.closeProps?.disabled,
              })}>
              <SvgImg
                type={SvgIconEnum.FCR_CLOSE}
                size={14}
                colors={{ iconPrimary: 'currentColor' }}></SvgImg>
            </div>
          </ToolTip>
        )}
      </div>
      {props.children}
    </div>
  );
};
