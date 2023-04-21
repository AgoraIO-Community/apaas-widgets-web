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
import { FcrBoardTool } from '../../../common/whiteboard-wrapper/type';

export const useVisibleTools = () => {
  const {
    observables: { currentTool, maxCountVisibleTools },
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
          tooltip="Text"
          icon={SvgIconEnum.FCR_WHITEBOARD_TEXT}
          onClick={handleToolChange(FcrBoardTool.Text)}
          isActive={currentTool === FcrBoardTool.Text}
        />
      ),
    },
    {
      renderItem: ({ offset }: { offset?: number } = {}) => <EraserPickerItem offset={offset} />,
    },
    {
      renderItem: () => {
        return (
          <ToolbarItem
            tooltip="Hand"
            icon={SvgIconEnum.FCR_WHITEBOARD_MOVESUBJECTS}
            onClick={handleToolChange(FcrBoardTool.Hand)}
            isActive={currentTool === FcrBoardTool.Hand}
          />
        );
      },
    },
  ];

  const fixedTools = [
    {
      renderItem: () => {
        return <div className="fcr-divider-vertical fcr-divider-marign-top"></div>;
      },
    },
    {
      renderItem: () => <ColorPickerItem />,
    },
    {
      renderItem: () => {
        return <div className="fcr-divider-vertical fcr-divider-marign-bottom"></div>;
      },
    },
    {
      renderItem: () => <UndoItem />,
    },
    {
      renderItem: () => <RedoItem />,
    },
  ];

  const baseExtraTools = [
    {
      renderItem: () => (
        <ToolbarItem tooltip="Cloud" icon={SvgIconEnum.FCR_WHITEBOARD_CLOUD} isActive={false} />
      ),
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltip="Laser Pen"
          icon={SvgIconEnum.FCR_WHITEBOARD_LASERPEN}
          onClick={handleToolChange(FcrBoardTool.LaserPointer)}
          isActive={currentTool === FcrBoardTool.LaserPointer}
        />
      ),
    },
    {
      renderItem: ({ offset }: { offset?: number } = {}) => (
        <ScreenCapturePickerItem offset={offset} />
      ),
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltip="Save"
          icon={SvgIconEnum.FCR_WHITEBOARD_SAVE}
          onClick={saveDraft}
          isActive={false}
        />
      ),
    },
  ];

  const dragTool = {
    renderItem: () => {
      return <MoveHandleItem />;
    },
  };

  const additionTool = {
    renderItem: () => {
      return <AdditionToolPickerItem />;
    },
  };

  // whether toolbar needs to shrink in vertical direction
  const isShinked =
    maxCountVisibleTools <
    baseMainTools.length + baseExtraTools.length + 4; /* 4 means fixedTools + dragTool */

  const maxCountAvailableToDisplay = maxCountVisibleTools - 4;

  const mainTools = isShinked
    ? range(0, max([0, min([maxCountAvailableToDisplay, baseMainTools.length])]))
        .map((index) => baseMainTools[index])
        .concat(fixedTools)
    : baseMainTools.concat(fixedTools);

  const extraTools = isShinked
    ? range(
        0,
        max([0, min([maxCountAvailableToDisplay - baseMainTools.length, baseExtraTools.length])]),
      )
        .map((index) => baseExtraTools[index])
        .concat([additionTool, dragTool])
    : baseExtraTools.concat([dragTool]);

  const additionToolsCount =
    baseMainTools.length + baseExtraTools.length - maxCountAvailableToDisplay;

  const additionTools = [...baseMainTools, ...baseExtraTools].reverse().filter((tool, index) => {
    if (index < additionToolsCount) {
      return true;
    }
    return false;
  });

  return {
    mainTools,
    extraTools,
    additionTools,
  };
};