import { useContext } from 'react';
import { SvgIconEnum } from '@components/svg-img';
import { ToolbarItem } from '.';
import { ColorPickerItem } from './color-picker';
import { EraserPickerItem } from './eraser-picker';
import { UndoItem, RedoItem } from './history';
import { MoveHandleItem } from './move-handle';
import { PenPickerItem } from './pen-picker';
import { ScreenCapturePickerItem } from './screen-capture-picker';
import { ShapePickerItem } from './shape-picker';
import { range, min, max } from 'lodash';
import { AdditionToolPickerItem } from './extra-tool-picker';
import { ToolbarUIContext } from '../ui-context';
import { FcrBoardTool } from '../../../../common/whiteboard-wrapper/type';

export const useVisibleTools = () => {
  const {
    observables: { currentTool, maxCountVisibleTools, toolbarDockPosition },
    setTool,
    saveDraft,
  } = useContext(ToolbarUIContext);

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
          tooltip="Clicker"
          icon={SvgIconEnum.FCR_WHITEBOARD_MOUSE}
          onClick={handleToolChange(FcrBoardTool.Clicker)}
          isActive={currentTool === FcrBoardTool.Clicker}
        />
      ),
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
          tooltip="Selector"
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
      renderItem: ({ offset }: { offset?: number } = {}) => <ShapePickerItem offset={offset} />,
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
          tooltip="Text"
          icon={SvgIconEnum.FCR_WHITEBOARD_TEXT}
          onClick={handleToolChange(FcrBoardTool.Text)}
          isActive={currentTool === FcrBoardTool.Text}
        />
      ),
    },
    {
      renderItem: () => {
        return (
          <ToolbarItem
            tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
            tooltip="Drag"
            icon={SvgIconEnum.FCR_WHITEBOARD_MOVESUBJECTS}
            onClick={handleToolChange(FcrBoardTool.Hand)}
            isActive={currentTool === FcrBoardTool.Hand}
          />
        );
      },
    },
    {
      renderItem: ({ offset }: { offset?: number } = {}) => <EraserPickerItem offset={offset} />,
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
          tooltip="Laser Pen"
          icon={SvgIconEnum.FCR_WHITEBOARD_LASERPEN}
          onClick={handleToolChange(FcrBoardTool.LaserPointer)}
          isActive={currentTool === FcrBoardTool.LaserPointer}
        />
      ),
    },
    // {
    //   renderItem: () => (
    //     <ToolbarItem tooltip="Cloud" icon={SvgIconEnum.FCR_WHITEBOARD_CLOUD} isActive={false} />
    //   ),
    // },
    // {
    //   renderItem: ({ offset }: { offset?: number } = {}) => (
    //     <ScreenCapturePickerItem offset={offset} />
    //   ),
    // },
    {
      renderItem: () => (
        <ToolbarItem
          tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
          tooltip="Save"
          icon={SvgIconEnum.FCR_WHITEBOARD_SAVE}
          onClick={saveDraft}
          isActive={false}
        />
      ),
    },
  ];

  const divider = {
    renderItem: () => <div className="fcr-divider-vertical fcr-divider-marign-bottom"></div>,
  };

  const fixedTools = [
    divider,
    {
      renderItem: () => <UndoItem />,
    },
    {
      renderItem: () => <RedoItem />,
    },
    {
      renderItem: () => {
        return <MoveHandleItem />;
      },
    },
  ];

  const additionTool = {
    renderItem: () => {
      return <AdditionToolPickerItem />;
    },
  };

  const colorTool = {
    renderItem: () => <ColorPickerItem />,
  };

  // whether toolbar needs to shrink in vertical direction
  const isShinked = maxCountVisibleTools < baseMainTools.length + 1;

  const showColorCount = isShinked
    ? 0
    : maxCountVisibleTools - baseMainTools.length; /* addition tool */

  if (showColorCount) {
    baseMainTools.push(divider);
    baseMainTools.push(colorTool);
  }

  const maxCountAvailableToDisplay = maxCountVisibleTools;

  const mainTools = isShinked
    ? range(0, max([0, min([maxCountAvailableToDisplay, baseMainTools.length])]))
        .map((index) => baseMainTools[index])
        .concat([additionTool])
        .concat(fixedTools)
    : baseMainTools.concat(fixedTools);

  const additionToolsCount = baseMainTools.length - maxCountAvailableToDisplay;

  let additionTools = [...baseMainTools].reverse().filter((tool, index) => {
    if (index < additionToolsCount) {
      return true;
    }
    return false;
  });

  if (isShinked) {
    additionTools.unshift(colorTool);
  }

  additionTools = additionTools.reverse();

  return {
    mainTools,
    additionTools,
    showColorCount,
    isShinked,
  };
};
