import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { PopoverWithTooltip } from '@components/popover';
import React, { FC } from 'react';
import classNames from 'classnames';
import { useVisibleTools } from './hooks';
import { DraggableWrapper } from './move-handle';

export const Toolbar = observer(() => {
  const { mainTools, extraTools } = useVisibleTools();

  return (
    <DraggableWrapper>
      <div className="fcr-board-toolbar-main">
        <ul className="fcr-board-toolbar-list">
          {mainTools.map(({ renderItem }, i) => {
            return <li key={i.toString()}>{renderItem()}</li>;
          })}
        </ul>
      </div>
      <div className="fcr-board-toolbar-extra">
        <ul className="fcr-board-toolbar-list">
          {extraTools.map(({ renderItem }, i) => {
            return <li key={i.toString()}>{renderItem()}</li>;
          })}
        </ul>
      </div>
    </DraggableWrapper>
  );
});

export const ToolbarItem: FC<{
  tooltip: string;
  icon: SvgIconEnum;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  onClick?: () => void;
  className?: string;
  isActive: boolean;
  isDisabled?: boolean;
}> = ({ tooltipPlacement, tooltip, icon, onClick, className, isActive, isDisabled }) => {
  const cls = classNames('fcr-board-toolbar-item-surrounding', className, {
    'fcr-board-toolbar-item-surrounding--active': isActive,
    'fcr-board-toolbar-item-surrounding--disabled': isDisabled,
  });
  return (
    <ToolTip placement={tooltipPlacement} content={tooltip}>
      <div className={cls} onClick={isDisabled ? undefined : onClick}>
        <SvgImg type={icon} size={30} />
      </div>
    </ToolTip>
  );
};

export const ExpansionToolbarItem: FC<{
  tooltip: string;
  popoverContent: React.ReactNode;
  icon: SvgIconEnum;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  popoverPlacement?: 'top' | 'bottom' | 'left' | 'right';
  popoverOverlayClassName?: string;
  onClick?: () => void;
  isActive: boolean;
  extensionMark?: boolean;
  popoverOffset?: number;
}> = ({
  tooltip,
  tooltipPlacement,
  popoverContent,
  popoverPlacement,
  icon,
  onClick,
  popoverOverlayClassName,
  isActive,
  extensionMark = true,
  popoverOffset = 6,
}) => {
  const cls = classNames('fcr-board-toolbar-item-surrounding', {
    'fcr-board-toolbar-item-surrounding--active': isActive,
  });

  return (
    <PopoverWithTooltip
      toolTipProps={{ placement: tooltipPlacement, content: tooltip }}
      popoverProps={{
        overlayOffset: popoverOffset,
        placement: popoverPlacement,
        content: popoverContent,
        overlayClassName: popoverOverlayClassName,
        visible: true,
      }}>
      <div className={cls} onClick={onClick}>
        <SvgImg type={icon} size={30} />
        {extensionMark && (
          <SvgImg
            type={SvgIconEnum.FCR_WHITEBOARD_LOWERRIGHTARROW}
            size={4}
            className="fcr-board-toolbar-expansion-icon"
          />
        )}
      </div>
    </PopoverWithTooltip>
  );
};
