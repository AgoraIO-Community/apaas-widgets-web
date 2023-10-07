import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg, SvgImgProps } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { PopoverWithTooltip } from '@components/popover';
import React, { FC, useState } from 'react';
import classNames from 'classnames';
import { useVisibleTools } from './hooks';
import { DraggableWrapper } from './move-handle';
import FoldIcon from '../fold-icon';

export const Toolbar = observer(() => {
  const { mainTools } = useVisibleTools();

  const [folded, setFolded] = useState<boolean | undefined>();

  const handleFoldClick = () => {
    setFolded(!folded);
  };

  const clsn = classNames({
    'fcr-board-toolbar--folded': folded,
    // prevent first animation play
    'fcr-board-toolbar--unfolded': typeof folded !== 'undefined' && !folded,
  });

  return (
    <DraggableWrapper className={clsn}>
      <div className="fcr-board-toolbar-main">
        <ul className="fcr-board-toolbar-list">
          {mainTools.map(({ renderItem }, i) => {
            return <li key={i.toString()}>{renderItem()}</li>;
          })}
        </ul>
      </div>
      {/* fold */}
      <div className={`fcr-board-toolbar-fold`} onClick={handleFoldClick}>
        <FoldIcon />
      </div>
    </DraggableWrapper>
  );
});
/** @internal */
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
        <SvgImg type={icon} size={28} />
      </div>
    </ToolTip>
  );
};
/** @internal */
export const ExpansionToolbarItem: FC<{
  tooltip: string;
  popoverContent: React.ReactNode;
  icon: SvgIconEnum;
  iconProps?: Partial<Omit<SvgImgProps, 'type'>>;

  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  popoverPlacement?: 'top' | 'bottom' | 'left' | 'right';
  popoverOverlayClassName?: string;
  onClick?: () => void;
  isActive: boolean;
  extensionMark?: boolean;
  extensionMarkProps?: Partial<SvgImgProps>;
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
  extensionMarkProps,
  popoverOffset = 6,
  iconProps,
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
        <SvgImg {...iconProps} type={icon} size={28} />
        {extensionMark && (
          <SvgImg
            type={SvgIconEnum.FCR_WHITEBOARD_LOWERRIGHTARROW}
            size={4}
            className="fcr-board-toolbar-expansion-icon"
            {...extensionMarkProps}
          />
        )}
      </div>
    </PopoverWithTooltip>
  );
};
