import { useContext } from 'react';
import { ToolbarItem } from '.';
import { UndoItem, RedoItem } from './history';
import { PenPickerItem } from './pen-picker';
import { ShapePickerItem } from './shape-picker';
import range from 'lodash/range';
import min from 'lodash/min';
import max from 'lodash/max';
import { ToolbarUIContext } from '../ui-context';
import { FcrBoardTool } from '../../../../common/whiteboard-wrapper/type';
import { useI18n } from 'agora-common-libs';
import { Dialog } from 'antd-mobile';
import { SvgIconEnum } from '@components/svg-img';
import { CleanModal } from './slideclear';
import { runInAction } from 'mobx';
import { windowClassName } from '../utils';

export const useVisibleTools = () => {
  const {
    observables,
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
    // {
    //   renderItem: () => (
    //     <ToolbarItem
    //       tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
    //       tooltip={transI18n('fcr_board_tool_save')}
    //       texttip={'Save png'}
    //       icon={SvgIconEnum.FCR_WHITEBOARD_SAVE}
    //       onClick={saveDraft}
    //       isActive={false}
    //     />
    //   ),
    // },
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
          tooltip={transI18n('fcr_board_tool_mobile_selector')}
          texttip={transI18n('fcr_board_tool_mobile_selector')}
          icon={SvgIconEnum.FCR_WHITECHOOSE_NEW}
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
    // {
    //   renderItem: () => (
    //     <ToolbarItem
    //       tooltip={transI18n('fcr_board_tool_save')}
    //       texttip={transI18n('fcr_board_tool_save')}
    //       icon={SvgIconEnum.FCR_WHITEBOARD_SAVE}
    //       onClick={saveDraft}
    //       isActive={false}
    //     />
    //   ),
    // },
    {
      renderItem: () => {
        const dialogToogle = (bool: boolean) => {
          if (bool) {
            clean();
          }
          Dialog.clear();
          runInAction(() => {
            observables.foldToolBar = false;
            observables.fixedBottomBarVisible = false;
          });
        };

        return (
          <ToolbarItem
            tooltip={transI18n('fcr_board_tool_clean')}
            texttip={transI18n('fcr_board_tool_clean')}
            icon={SvgIconEnum.FCR_CLEANWHITEBOARD}
            onClick={() => {
              runInAction(() => {
                observables.fixedBottomBarVisible = false;
                observables.foldToolBar = true;
              });
              Dialog.show({
                maskStyle: { background: 'var(--fcr_ui_scene_mask, rgba(8, 8, 8, 0.35))' },
                // getContainer: () => {
                //   return document.querySelector(`.${windowClassName}`) as HTMLElement;
                // },
                bodyStyle: {
                  width: 'max-content',
                },
                content: <CleanModal onToggle={dialogToogle} />,
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
