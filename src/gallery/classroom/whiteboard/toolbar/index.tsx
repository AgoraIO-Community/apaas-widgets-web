import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg, SvgImgProps } from '@components/svg-img';
import { DialogToolTip } from '@components/tooltip/dialog';
import { PopoverWithTooltip } from '@components/popover';
import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { runInAction } from 'mobx';
import classNames from 'classnames';
import { useVisibleTools } from './hooks';
import { DraggableWrapper } from './move-handle';
import './index.css';
import { BoardUIContext, ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';
import { ScenePagination } from '../scene-pagination';
import { FcrBoardShape, FcrBoardTool } from '../../../../common/whiteboard-wrapper/type';
import { PenPickerPanel } from './pen-picker';
import { ShapePickerPanel } from './shape-picker';
import { SelectorPickerPanel } from './selector-picker';
import classnames from 'classnames';

export const Toolbar = observer(() => {
  const { mobileFixedTools } = useVisibleTools();
  const {
    observables,
    observables: { currentShape, currentTool, foldToolBar, fixedToolVisible, hasSelectorContainer },
  } = useContext(ToolbarUIContext);
  const {
    observables: { canOperate, isLandscape },
  } = useContext(BoardUIContext);
  const transI18n = useI18n();

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

  useEffect(() => {
    let observer: any;
    if (FcrBoardTool.Selector === currentTool) {
      observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
          if (mutation.type === 'childList') {
            // 检查是否存在 .highlight-box 类, 表示图形是否被选中
            const highlightBoxExists =
              document.querySelector(
                '.netless-whiteboard.cursor-selector .component .highlight-box',
              ) !== null;
            runInAction(() => {
              observables.hasSelectorContainer = !!highlightBoxExists;
              observables.fixedToolVisible = !!highlightBoxExists;
            });
          }
        }
      });
      const targetNode = document.querySelector('.netless-whiteboard.cursor-selector');
      if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
      }
    } else {
      observer && observer.disconnect();
    }

    return () => observer && observer.disconnect();
  }, [currentTool]);

  const handleObserverBack = (args: any) => {
    console.log('this---args', args);
  };

  const handleFoldClick = (bool: boolean) => {
    // setFolded(!folded);
    runInAction(() => {
      observables.foldToolBar = bool;
    });
  };

  const clsn = classNames({
    'fcr-board-toolbar--folded': foldToolBar,
    // prevent first animation play
    'fcr-board-toolbar--unfolded': typeof foldToolBar !== 'undefined' && !foldToolBar,
  });

  // const {
  //   shareUIStore: { isLandscape, setForceLandscape },
  // } = useStore();
  console.log('this----neitb ucanOperate', foldToolBar, isLandscape, canOperate);

  if (!canOperate) return null;
  return (
    <>
      <DraggableWrapper className={clsn}>
        <>
          {/* fold */}
          {foldToolBar ? (
            <div className={`fcr-board-toolbar-fold`} onClick={() => handleFoldClick(false)}>
              <div
                className={classnames(
                  'fcr-mobile-board-expand fcr-t-0 fcr-l-0 fcr-h-full fcr-flex fcr-justify-center',
                )}>
                <SvgImg
                  type={SvgIconEnum.WHITEBOARDEDIT}
                  colors={{ iconPrimary: 'white' }}
                  size={32}></SvgImg>
              </div>
            </div>
          ) : (
            <div className="fcr-board-toolbar-main">
              <div className="fcr-board-title-box" onClick={() => handleFoldClick(true)}>
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
            {hasSelectorContainer && <SelectorPickerPanel />}
          </>
        }
        visible={fixedToolVisible}
        showArrow={false}
        closeable={false}
      />
      {canOperate && !foldToolBar && <ScenePagination />}
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
