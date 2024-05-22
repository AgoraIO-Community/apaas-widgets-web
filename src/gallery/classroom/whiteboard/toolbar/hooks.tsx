import { useContext, useEffect, useRef, useState } from 'react';
import { ToolbarItem } from '.';
import { ColorPickerItem } from './color-picker';
import { EraserPickerItem } from './eraser-picker';
import { UndoItem, RedoItem } from './history';
import { MoveHandleItem } from './move-handle';
import { PenPickerItem } from './pen-picker';
import { ShapePickerItem } from './shape-picker';
import range from 'lodash/range';
import min from 'lodash/min';
import max from 'lodash/max';
import { AdditionToolPickerItem } from './extra-tool-picker';
import { ToolbarUIContext } from '../ui-context';
import { FcrBoardTool } from '../../../../common/whiteboard-wrapper/type';
import { useI18n } from 'agora-common-libs';
import { Dialog } from 'antd-mobile';
import { SvgIconEnum, SvgImg } from './../../../../../../fcr-ui-kit/src/components/svg-img';
import CleanSimpleVerify from './slideclear';

export const useVisibleTools = () => {
  const {
    observables: { currentTool, maxCountVisibleTools, toolbarDockPosition },
    clean,
    setTool,
    saveDraft,
  } = useContext(ToolbarUIContext);
  const transI18n = useI18n();

  const handleToolChange = (tool: FcrBoardTool) => {
    return () => {
      setTool(tool);
    };
  };
  const baseMainTools = [
    {
      renderItem: () => (
        <ToolbarItem
          tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
          tooltip={transI18n('fcr_board_tool_mobile_selector')}
          texttip={transI18n('fcr_board_tool_mobile_selector')}
          icon={SvgIconEnum.FCR_WHITECHOOSE}
          onClick={handleToolChange(FcrBoardTool.Selector)}
          isActive={currentTool === FcrBoardTool.Selector}
        />
      ),
    },
    {
      renderItem: ({ offset }: { offset?: number } = {}) => <PenPickerItem offset={offset} />,
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
          tooltip={transI18n('fcr_board_tool_text')}
          texttip={'Texture'}
          icon={SvgIconEnum.FCR_WHITEBOARD_TEXT}
          onClick={handleToolChange(FcrBoardTool.Text)}
          isActive={currentTool === FcrBoardTool.Text}
        />
      ),
    },
    {
      renderItem: ({ offset }: { offset?: number } = {}) => <ShapePickerItem offset={offset} />,
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
          tooltip={transI18n('fcr_board_tool_save')}
          texttip={'Save png'}
          icon={SvgIconEnum.FCR_WHITEBOARD_SAVE}
          onClick={saveDraft}
          isActive={false}
        />
      ),
    },
    {
      renderItem: () => {
        return (
          <ToolbarItem
            tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
            tooltip={transI18n('fcr_board_tool_drag')}
            icon={SvgIconEnum.FCR_WHITEBOARD_MOVESUBJECTS}
            onClick={handleToolChange(FcrBoardTool.Hand)}
            isActive={currentTool === FcrBoardTool.Hand}
          />
        );
      },
    },
  ];

  const mobileFixedTools = [
    {
      renderItem: () => (
        <ToolbarItem
          tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
          tooltip={transI18n('fcr_board_tool_mobile_selector')}
          texttip={transI18n('fcr_board_tool_mobile_selector')}
          icon={SvgIconEnum.FCR_WHITECHOOSE}
          onClick={handleToolChange(FcrBoardTool.Selector)}
          isActive={currentTool === FcrBoardTool.Selector}
        />
      ),
    },
    {
      renderItem: ({ offset }: { offset?: number } = {}) => <PenPickerItem offset={offset || -1} />,
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
          tooltip={transI18n('fcr_board_tool_text')}
          texttip={transI18n('fcr_board_tool_text')}
          icon={SvgIconEnum.FCR_WHITEBOARD_TEXT}
          onClick={handleToolChange(FcrBoardTool.Text)}
          isActive={currentTool === FcrBoardTool.Text}
        />
      ),
    },
    {
      renderItem: ({ offset }: { offset?: number } = {}) => (
        <ShapePickerItem offset={offset || -1} />
      ),
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
          tooltip={transI18n('fcr_board_tool_save')}
          texttip={transI18n('fcr_board_tool_save')}
          icon={SvgIconEnum.FCR_WHITEBOARD_SAVE}
          onClick={saveDraft}
          isActive={false}
        />
      ),
    },
    {
      renderItem: () => {
        return (
          <ToolbarItem
            tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
            tooltip={transI18n('fcr_board_tool_clean')}
            texttip={transI18n('fcr_board_tool_clean')}
            icon={SvgIconEnum.FCR_CLEANWHITEBOARD}
            onClick={() => {
              setTool(FcrBoardTool.Clean);
              Dialog.show({
                maskStyle: { background: 'none' },
                bodyStyle: {
                  width: '244px',
                },
                content: (
                  <>
                    <CleanSimpleVerify
                      verify={() => {
                        Dialog.clear();
                        clean();
                      }}
                    />
                    <div className="fcr-mobile-slide__close" onClick={() => Dialog.clear()}>
                      <SvgImg
                        type={SvgIconEnum.FCR_MOBILE_CLOSE}
                        colors={{ iconPrimary: '#FB584E' }}
                        size={16}
                      />
                    </div>
                  </>
                ),
                className: 'fcr-mobile-slide__dialog',
              });
            }}
            isActive={currentTool === FcrBoardTool.Clean}
          />
        );
      },
    },
  ];

  const divider = {
    renderItem: () => <div className="fcr-divider-vertical fcr-divider-mobile-line"></div>,
  };

  const fixedTools = [
    divider,
    // {
    //   renderItem: () => <UndoItem />,
    // },
    // {
    //   renderItem: () => <RedoItem />,
    // },
    // {
    //   renderItem: () => {
    //     return <MoveHandleItem />;
    //   },
    // },
  ];

  const fixedUndoItem = [
    {
      renderItem: () => <UndoItem />,
    },
    {
      renderItem: () => <RedoItem />,
    },
  ];

  // whether toolbar needs to shrink in vertical direction
  const isShinked = maxCountVisibleTools < baseMainTools.length + 1;

  const showColorCount = isShinked
    ? 0
    : maxCountVisibleTools - baseMainTools.length; /* addition tool */

  // if (showColorCount) {
  //   baseMainTools.push(divider);
  //   baseMainTools.push(colorTool);
  // }

  const maxCountAvailableToDisplay = maxCountVisibleTools;

  const mainTools = isShinked
    ? range(0, max([0, min([maxCountAvailableToDisplay, baseMainTools.length])]))
        .map((index) => baseMainTools[index])
        .concat(fixedTools)
    : baseMainTools.concat(fixedTools);

  return {
    mainTools,
    mobileFixedTools,
    fixedUndoItem,
    showColorCount,
    isShinked,
  };
};
