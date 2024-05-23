import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg, SvgImgProps } from '@components/svg-img';
import { DialogToolTip } from '@components/tooltip/dialog';
import { PopoverWithTooltip } from '@components/popover';
import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { runInAction } from 'mobx';
import classNames from 'classnames';
import { useVisibleTools } from './hooks';
import { DraggableWrapper } from './move-handle';
import { BoardExpand } from '../../../../../../agora-classroom-sdk/src/containers/board-expand';
import './index.css';
import { BoardUIContext, ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';
import { ScenePagination } from '../scene-pagination';
import { FcrBoardShape } from '../../../../common/whiteboard-wrapper/type';
import { PenPickerPanel } from './pen-picker';
import { ShapePickerPanel } from './shape-picker';

export const Toolbar = observer(() => {
  const { mobileFixedTools } = useVisibleTools();
  const {
    observables,
    observables: { currentShape, currentTool, fixedToolVisible },
  } = useContext(ToolbarUIContext);
  const {
    observables: { canOperate },
  } = useContext(BoardUIContext);
  const transI18n = useI18n();

  const [folded, setFolded] = useState<boolean | undefined>(true);

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

  const penActive = currentShape === FcrBoardShape.Curve || currentShape === FcrBoardShape.Straight;
  const shapeActive =
    !!currentShape &&
    [
      FcrBoardShape.Arrow,
      FcrBoardShape.Ellipse,
      FcrBoardShape.Pentagram,
      FcrBoardShape.Rectangle,
      FcrBoardShape.Rhombus,
      FcrBoardShape.Triangle,
    ].includes(currentShape);

  return (
    <>
      <DraggableWrapper className={clsn}>
        <>
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
        </>
      </DraggableWrapper>
      <DialogToolTip
        placement="top"
        overlayOffset={-1}
        overlayClassName="fcr-board-toolbar__picker__overlay fcr-board-toolbar__fixedbottom"
        getTooltipContainer={() =>
          document.querySelector('#fcr_board_center_position') as HTMLElement
        }
        content={
          <>
            {penActive && <PenPickerPanel />}
            {shapeActive && <ShapePickerPanel />}
          </>
        }
        visible={(penActive || shapeActive) && fixedToolVisible}
        showArrow={false}
        closeable={false}
      />
      {canOperate && !folded && <ScenePagination />}
    </>
  );
});

// export const ToolbarRight = observer(() => {});

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
