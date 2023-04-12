import { observer } from 'mobx-react';
import { FcrBoardTool } from '../../wrapper/type';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { PopoverWithTooltip } from '@components/popover';
import React, { FC, useContext } from 'react';
import { ToolbarUIContext } from '../../ui-context';
import classNames from 'classnames';
import { PenPickerItem } from './pen-picker';
import { ShapePickerItem } from './shape-picker';
import { EraserPickerItem } from './eraser-picker';
import { ColorPickerItem } from './color-picker';
import { ScreenCapturePickerItem } from './screen-capture-picker';
import { DraggableWrapper, MoveHandleItem } from './move-handle';
import { RedoItem, UndoItem } from './redo';

export const Toolbar = observer(() => {
  const {
    observables: { currentTool },
    setTool,
    saveDraft,
  } = useContext(ToolbarUIContext);

  const handleToolChange = (tool: FcrBoardTool) => {
    return () => {
      setTool(tool);
    };
  };

  const tools = [
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
      renderItem: () => <PenPickerItem />,
    },
    {
      renderItem: () => <ShapePickerItem />,
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
      renderItem: () => <EraserPickerItem />,
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
    {
      renderItem: () => {
        return <div className="fcr-divider-vertical"></div>;
      },
    },
    {
      renderItem: () => <ColorPickerItem />,
    },
    {
      renderItem: () => {
        return <div className="fcr-divider-vertical"></div>;
      },
    },
    {
      renderItem: () => <UndoItem />,
    },
    {
      renderItem: () => <RedoItem />,
    },
  ];

  const extraTools = [
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
      renderItem: () => <ScreenCapturePickerItem />,
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
    {
      renderItem: () => {
        return <MoveHandleItem />;
      },
    },
  ];

  return (
    <DraggableWrapper>
      <div className="fcr-board-toolbar">
        <div className="fcr-board-toolbar-main">
          <ul className="fcr-board-toolbar-list">
            {tools.map(({ renderItem }, i) => {
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
}> = ({
  tooltip,
  tooltipPlacement,
  popoverContent,
  popoverPlacement,
  icon,
  onClick,
  popoverOverlayClassName,
  isActive,
}) => {
  const cls = classNames('fcr-board-toolbar-item-surrounding', {
    'fcr-board-toolbar-item-surrounding--active': isActive,
  });

  return (
    <PopoverWithTooltip
      toolTipProps={{ placement: tooltipPlacement, content: tooltip }}
      popoverProps={{
        overlayOffset: 6,
        placement: popoverPlacement,
        content: popoverContent,
        overlayClassName: popoverOverlayClassName,
        visible: true,
      }}>
      <div className={cls} onClick={onClick}>
        <SvgImg type={icon} size={30} />
        <SvgImg
          type={SvgIconEnum.FCR_WHITEBOARD_LOWERRIGHTARROW}
          size={4}
          className="fcr-board-toolbar-expansion-icon"
        />
      </div>
    </PopoverWithTooltip>
  );
};
