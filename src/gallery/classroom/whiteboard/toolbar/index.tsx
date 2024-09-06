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
import {
  FcrBoardShape,
  FcrBoardTool,
  BoardConnectionState,
} from '../../../../common/whiteboard-wrapper/type';
import { PenPickerPanel } from './pen-picker';
import { ShapePickerPanel } from './shape-picker';
import { SelectorPickerPanel } from './selector-picker';
import classnames from 'classnames';
import { Loading } from '../loading';

export const Toolbar = observer(({ closeToolBar }: any) => {
  const { mobileFixedTools } = useVisibleTools();
  const {
    observables,
    observables: {
      currentShape,
      currentTool,
      foldToolBar,
      fixedBottomBarVisible,
      hasSelectorContainer,
      toolbarDockPosition,
    },
  } = useContext(ToolbarUIContext);
  const {
    observables: { canOperate, connectionState, isLandscape },
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
              observables.fixedBottomBarVisible = !!highlightBoxExists;
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

  useEffect(() => {
    const element: any = document.querySelector(
      '.whiteboard-mobile-container .netless-whiteboard-wrapper',
    );
    // const chatDom: any = document.querySelector('.widget-slot-chat-mobile');
    const inputDom: any = document.querySelector('.landscape-bottom-tools');
    const pptDom: any = document.querySelector('.netless-app-slide-wb-view');

    if (!element) return;
    if (!fixedBottomBarVisible && foldToolBar) {
      element.style.pointerEvents = 'none';
      pptDom ? pptDom.style.setProperty('pointer-events', 'none', 'important') : '';
      inputDom ? (inputDom.style.bottom = '0') : '';
    } else {
      element.style.pointerEvents = 'auto';
      pptDom ? pptDom.style.setProperty('pointer-events', 'auto', 'important') : '';
      inputDom ? (inputDom.style.bottom = '-100px') : '';
    }
    // if (!chatDom) return;
    // const height = chatDom.style.height;
    // if (!fixedBottomBarVisible && foldToolBar) {
    //   chatDom.style.height = height;
    // } else {
    //   chatDom.style.height = '0';
    // }
    // return () => {
    //   if (chatDom) {
    //     chatDom.style.height = '256px';
    //   }
    // };
  }, [fixedBottomBarVisible, foldToolBar]);

  const handleFoldClick = (bool: boolean) => {
    runInAction(() => {
      observables.foldToolBar = bool;
      if (!bool && closeToolBar) {
        closeToolBar();
      }
    });
  };

  const clsn = classNames({
    'fcr-board-toolbar--folded': foldToolBar,
    // prevent first animation play
    'fcr-board-toolbar--unfolded': typeof foldToolBar !== 'undefined' && !foldToolBar,
  });
  console.log('this-----toolbar', connectionState, canOperate, isLandscape, !fixedBottomBarVisible);
  if (!canOperate) return null;
  return (
    <>
      {connectionState === BoardConnectionState.Connected ? (
        <>
          {isLandscape && !fixedBottomBarVisible ? (
            // <DraggableWrapper className={clsn}>
            <>
              {foldToolBar ? (
                <div
                  className="fcr-board-toolbar-fold"
                  style={{
                    bottom: (toolbarDockPosition.y || 12) + 'px',
                  }}
                  onClick={() => handleFoldClick(false)}>
                  <div
                    className={classnames(
                      'fcr-mobile-board-expand fcr-t-0 fcr-l-0 fcr-h-full fcr-flex fcr-justify-center',
                    )}>
                    <SvgImg
                      type={SvgIconEnum.WHITEBOARDEDIT}
                      colors={{ iconPrimary: '#151515' }}
                      size={32}></SvgImg>
                  </div>
                </div>
              ) : (
                <div className="fcr-board-toolbar-main">
                  <div className="fcr-board-title-box" onClick={() => handleFoldClick(true)}>
                    <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_TOOLS} size={30}  colors={{iconPrimary: '#151515' }}/>
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
          ) : (
            // </DraggableWrapper>
            <DialogToolTip
              placement="top"
              overlayOffset={-1}
              overlayClassName="fcr-board-toolbar__picker__overlay fcr-board-toolbar__fixedbottom"
              getTooltipContainer={() =>
                document.querySelector('#fcr_board_center_position') as HTMLElement
              }
              content={
                <>
                  {penActive && <PenPickerPanel key="penActive" />}
                  {shapeActive && <ShapePickerPanel key="shapeActive" />}
                  {hasSelectorContainer && <SelectorPickerPanel key="SelectorPickerPanel" />}
                </>
              }
              visible={fixedBottomBarVisible}
              showArrow={false}
              closeable={false}
            />
          )}
        </>
      ) : null}
      <Loading />
      {canOperate && isLandscape && !fixedBottomBarVisible && !foldToolBar && <ScenePagination />}
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
    <div className={cls} onClick={isDisabled ? undefined : onClick}>
      <SvgImg type={icon} size={28}  colors={{iconPrimary:'#151515',iconSecondary:'#373C42'}}/>
      {texttip && <text>{texttip}</text>}
    </div>
  );
};

/** @internal */
export const ExpansionToolbarItem: FC<{
  tooltip?: string;
  popoverContent: React.ReactNode;
  icon: SvgIconEnum;
  iconProps?: Partial<Omit<SvgImgProps, 'type'>>;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  popoverPlacement?: 'top' | 'bottom' | 'left' | 'right';
  popoverOverlayClassName?: string;
  overlayInnerStyle?: object;
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
  overlayInnerStyle,
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
      toolTipProps={tooltip ? { placement: tooltipPlacement, content: tooltip } : undefined}
      popoverProps={{
        overlayOffset: popoverOffset,
        placement: popoverPlacement,
        content: popoverContent,
        overlayClassName: popoverOverlayClassName,
        overlayInnerStyle,
        visible: true,
      }}>
      <div className={cls} onClick={onClick}>
        <SvgImg colors={{ iconPrimary: '#151515' }} {...iconProps} type={icon} size={28} />
        {texttip && <div className="fcr-board-toolbar-item__texttip">{texttip}</div>}
      </div>
    </PopoverWithTooltip>
  );
};
