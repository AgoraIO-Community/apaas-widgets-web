import { observer } from 'mobx-react';
import {
  SvgIconEnum,
  SvgImg,
  SvgImgProps,
} from './../../../../../../fcr-ui-kit/src/components/svg-img';
import { ToolTip, ToolTipProps } from './../../../../../../fcr-ui-kit/src/components/tooltip';
import { DialogToolTip } from './../../../../../../fcr-ui-kit/src/components/tooltip/dialog';
import { ClassDialog } from './../../../../../../fcr-ui-kit/src/components/dialog';
import { PopoverWithTooltip } from './../../../../../../fcr-ui-kit/src/components/popover';
import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { runInAction } from 'mobx';
import classNames from 'classnames';
import { useVisibleTools } from './hooks';
import { DraggableWrapper } from './move-handle';
import { BoardExpand } from '../../../../../../agora-classroom-sdk/src/containers/board-expand';
import './index.css';
import { ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';

export const Toolbar = observer(() => {
  const { mobileFixedTools } = useVisibleTools();
  const { observables } = useContext(ToolbarUIContext);
  const transI18n = useI18n();

  const [folded, setFolded] = useState<boolean | undefined>(false);

  useEffect(() => {
    runInAction(() => {
      observables.toolbarDockPosition = {
        x: folded ? 16 : 6,
        y: 12,
        placement: 'left',
      };
    });
  }, [folded]);

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
      {/* fold */}
      {folded ? (
        <div className={`fcr-board-toolbar-fold`} onClick={handleFoldClick}>
          <BoardExpand
            iconEnum={SvgIconEnum.WHITEBOARDEDIT}
            style={{
              width: '40px',
              height: '40px',
            }}
          />
        </div>
      ) : (
        <div className="fcr-board-toolbar-main">
          <div className="fcr-board-title-box" onClick={handleFoldClick}>
            <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_TOOLS} size={30} />
            <span className="fcr-board-title">{transI18n('fcr_board_toolbar_hide')}</span>
          </div>
          <ul className="fcr-board-toolbar-list">
            {mobileFixedTools.map(({ renderItem }, i) => {
              return <li key={i.toString()}>{renderItem()}</li>;
            })}
          </ul>
        </div>
      )}
    </DraggableWrapper>
  );
});

export const ToolbarRight = observer(() => {});

/** @internal */
export const ToolbarItem: FC<{
  tooltip: string;
  texttip?: string;
  icon: SvgIconEnum;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  onClick?: () => void;
  className?: string;
  isActive: boolean;
  isDisabled?: boolean;
}> = ({ tooltipPlacement, tooltip, icon, onClick, className, texttip, isActive, isDisabled }) => {
  const cls = classNames('fcr-board-toolbar-item-surrounding', className, {
    'fcr-board-toolbar-item-surrounding--active': isActive,
    'fcr-board-toolbar-item-surrounding--disabled': isDisabled,
  });

  return (
    // <ToolTip placement={tooltipPlacement} content={tooltip}>
    <div className={cls} onClick={isDisabled ? undefined : onClick}>
      <SvgImg type={icon} size={28} />
      {texttip && <text>{texttip}</text>}
    </div>
    // </ToolTip>
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
  texttip?: string;
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
  texttip,
}) => {
  const cls = classNames('', {
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
        <SvgImg colors={{ iconPrimary: 'white' }} {...iconProps} type={icon} size={28} />
        {texttip && <div className="fcr-board-toolbar-item__texttip">{texttip}</div>}
      </div>
    </PopoverWithTooltip>
  );
};

/** @internal */
export const ExpansionFixbarItem: FC<{
  tooltip: string;
  popoverContent: React.ReactNode;
  icon: SvgIconEnum;
  iconProps?: Partial<Omit<SvgImgProps, 'type'>>;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  popoverPlacement?: 'top' | 'bottom' | 'left' | 'right';
  popoverOverlayClassName?: string;
  onClick?: () => void;
  onTargetClick?: () => void;
  setToolVisible?: () => void;
  getTooltipContainer?: (node: HTMLElement) => HTMLElement;
  isActive: boolean;
  toolVisible?: boolean;
  extensionMark?: boolean;
  extensionMarkProps?: Partial<SvgImgProps>;
  popoverOffset?: number;
  texttip?: string;
}> = ({
  tooltip,
  tooltipPlacement,
  popoverContent,
  popoverPlacement,
  icon,
  onClick,
  onTargetClick,
  popoverOverlayClassName,
  isActive,
  toolVisible,
  extensionMark = true,
  extensionMarkProps,
  getTooltipContainer,
  popoverOffset = 0,
  iconProps,
  texttip,
  setToolVisible,
}) => {
  const cls = classNames('fcr-board-toolbar-item-surrounding', {
    'fcr-board-toolbar-item-surrounding--active': isActive,
  });
  const handleClick = () => {
    setToolVisible && setToolVisible();
    onClick && onClick();
    onTargetClick && onTargetClick();
  };

  return (
    <>
      <div className={cls} onClick={handleClick}>
        <SvgImg colors={{ iconPrimary: 'white' }} {...iconProps} type={icon} size={28} />
        {texttip && <div className="fcr-board-toolbar-item__texttip">{texttip}</div>}
      </div>
      <DialogToolTip
        placement={popoverPlacement}
        overlayOffset={popoverOffset}
        overlayClassName={popoverOverlayClassName}
        getTooltipContainer={getTooltipContainer}
        content={popoverContent}
        visible={toolVisible}
        showArrow={false}
        closeable={false}
        onClose={setToolVisible}></DialogToolTip>
    </>
  );
};
