import { observer } from 'mobx-react';
import { FcrBoardTool, FcrBoardShape } from '../wrapper/type';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { Popover, PopoverWithTooltip } from '@components/popover';
import { HorizontalSlider } from '@components/slider';
import React, { FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { ToolbarUIContext } from '../ui-context';
import classNames from 'classnames';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

export const Toolbar = observer(() => {
  const {
    observables: {},
    redo,
    undo,
  } = useContext(ToolbarUIContext);

  const currentColor = '';
  const handleToolChange = (tool: FcrBoardTool) => {
    return () => {};
  };

  const handleColorChange = (color: string) => {
    return () => {};
  };

  const tools = [
    {
      renderItem: () => (
        <ToolbarItem
          tooltip="Clicker"
          // tooltipPlacement="right"
          icon={SvgIconEnum.FCR_WHITEBOARD_MOUSE}
          onClick={handleToolChange(FcrBoardTool.Clicker)}
        />
      ),
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltip="Selector"
          // tooltipPlacement
          icon={SvgIconEnum.FCR_WHITECHOOSE}
          onClick={handleToolChange(FcrBoardTool.Selector)}
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
          // tooltipPlacement=""
          icon={SvgIconEnum.FCR_WHITEBOARD_TEXT}
          onClick={handleToolChange(FcrBoardTool.Text)}
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
            // tooltipPlacement=""
            icon={SvgIconEnum.FCR_WHITEBOARD_MOVESUBJECTS}
            onClick={handleToolChange(FcrBoardTool.Hand)}
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
      renderItem: () => {
        return (
          <ToolbarItem
            tooltip="Undo"
            // tooltipPlacement=""
            icon={SvgIconEnum.FCR_MOBILE_WHITEBOARD_UNDO}
            onClick={undo}
          />
        );
      },
    },
    {
      renderItem: () => {
        return (
          <ToolbarItem
            tooltip="Redo"
            // tooltipPlacement=""
            icon={SvgIconEnum.FCR_MOBILE_WHITEBOARD_REDO}
            onClick={redo}
          />
        );
      },
    },
  ];

  const extraTools = [
    {
      renderItem: () => (
        <ToolbarItem
          tooltip="Cloud"
          // tooltipPlacement=""
          icon={SvgIconEnum.FCR_WHITEBOARD_CLOUD}
          onClick={handleToolChange(FcrBoardTool.Clicker)}
        />
      ),
    },
    {
      renderItem: () => (
        <ToolbarItem
          tooltip="Laser Pen"
          // tooltipPlacement=""
          icon={SvgIconEnum.FCR_WHITEBOARD_LASERPEN}
          onClick={handleToolChange(FcrBoardTool.Clicker)}
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
          // tooltipPlacement=""
          icon={SvgIconEnum.FCR_WHITEBOARD_SAVE}
          onClick={handleToolChange(FcrBoardTool.Clicker)}
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

const DraggableWrapper: FC<PropsWithChildren> = observer(({ children }) => {
  const { observables, dragToolbar, releaseToolbar } = useContext(ToolbarUIContext);
  const { toolbarPosition, toolbarReleased, toolbarDockPosition } = observables;
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));
  useEffect(() => {
    const mouseReleaseHandler = () => {
      releaseToolbar();
    };
    window.addEventListener('mouseup', mouseReleaseHandler);

    return () => {
      window.removeEventListener('mouseup', mouseReleaseHandler);
    };
  }, []);

  useEffect(() => {
    if (toolbarReleased) {
      api.start({ ...toolbarDockPosition, immediate: false });
    }
  }, [toolbarReleased]);

  useEffect(() => {
    dragToolbar();
    api.start({ x: toolbarPosition.x, y: toolbarPosition.y, immediate: false });
  }, [toolbarPosition.x, toolbarPosition.y]);

  return <animated.div style={{ x, y }}>{children}</animated.div>;
});

const ToolbarItem: FC<{
  tooltip: string;
  icon: SvgIconEnum;
  tooltipPlacement?: string;
  onClick?: () => void;
  className?: string;
}> = ({ tooltipPlacement, tooltip, icon, onClick, className }) => {
  const cls = classNames('fcr-board-toolbar-item-surrounding', className);
  return (
    <ToolTip placement={tooltipPlacement} content={tooltip}>
      <div className={cls} onClick={onClick}>
        <SvgImg type={icon} size={30} />
      </div>
    </ToolTip>
  );
};

const ExpansionToolbarItem: FC<{
  tooltip: string;
  popoverContent: React.ReactNode;
  icon: SvgIconEnum;
  tooltipPlacement?: string;
  popoverPlacement?: string;
  popoverOverlayClassName?: string;
  onClick?: () => void;
}> = ({
  tooltip,
  tooltipPlacement,
  popoverContent,
  popoverPlacement,
  icon,
  onClick,
  popoverOverlayClassName,
}) => {
  return (
    <PopoverWithTooltip
      toolTipProps={{ placement: tooltipPlacement, content: tooltip }}
      popoverProps={{
        placement: popoverPlacement,
        content: popoverContent,
        overlayClassName: popoverOverlayClassName,
      }}>
      <div className="fcr-board-toolbar-item-surrounding" onClick={onClick}>
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

const ColorPickerItem: FC = observer(() => {
  const isActive = 'fcr-board-toolbar__color-item--active';
  const {
    observables: { currentColor },
    setStrokeColor,
  } = useContext(ToolbarUIContext);

  const handleClickColor = (color: string) => {
    return () => {
      setStrokeColor();
    };
  };

  return (
    <ExpansionToolbarItem
      tooltip="Shape"
      icon={SvgIconEnum.FCR_WHITEBOARD_SHAP_CIRCLE}
      onClick={handleClickColor('')}
      popoverPlacement="right"
      popoverContent={<ColorPickerPanel />}
    />
  );
});

const ShapePickerItem: FC = observer(() => {
  const handleShapeToolChange = (shapeTool: FcrBoardShape) => {
    return () => {};
  };

  return (
    <ExpansionToolbarItem
      tooltip="Shape"
      icon={SvgIconEnum.FCR_WHITEBOARD_SHAP_CIRCLE}
      onClick={handleShapeToolChange(FcrBoardShape.Straight)}
      popoverPlacement="right"
      popoverContent={<ShapePickerPanel />}
    />
  );
});

const PenPickerItem: FC = observer(() => {
  const {
    observables: {},
    setStrokeColor,
    setShape,
    setTool,
  } = useContext(ToolbarUIContext);

  return (
    <ExpansionToolbarItem
      tooltip="Pen"
      icon={SvgIconEnum.FCR_WHITEBOARD_PED_CURVE}
      popoverPlacement="right"
      popoverOverlayClassName="fcr-board-toolbar__pen-picker__overlay"
      popoverContent={<PenPickerPanel />}
    />
  );
});

const MoveHandleItem = () => {
  const { setToolbarPosition, setToolbarDockPosition } = useContext(ToolbarUIContext);
  const bind = useDrag(({ movement: [mx, my] }) => {
    if (mx > window.innerWidth / 2) {
      setToolbarDockPosition({ x: window.innerWidth - 50, y: 0 });
    } else {
      setToolbarDockPosition({ x: 0, y: 0 });
    }
    setToolbarPosition({ x: mx, y: my });
  });

  return (
    <div {...bind()}>
      <ToolbarItem
        tooltip="Move"
        // tooltipPlacement=""
        icon={SvgIconEnum.FCR_WHITEBOARD_MOVE}
        className="fcr-board-toolbar-handle"
      />
    </div>
  );
};

const EraserPickerItem: FC = observer(() => {
  return (
    <ExpansionToolbarItem
      tooltip="Eraser"
      popoverPlacement="right"
      icon={SvgIconEnum.FCR_WHITEBOARD_ERASER}
      popoverContent={<EraserPickerPanel />}
    />
  );
});

const ScreenCapturePickerItem: FC = observer(() => {
  return (
    <ExpansionToolbarItem
      tooltip="Screen"
      popoverPlacement="right"
      icon={SvgIconEnum.FCR_WHITEBOARD_SHAP_REHUMBUS}
      popoverContent={<ScreenCapturePickerPanel />}
    />
  );
});

const ColorPickerPanel = () => {
  const colors = [''];
  return (
    <div className="fcr-board-toolba-panel">
      {colors.map((color) => {
        return <div key={color} />;
      })}
    </div>
  );
};

const PenPickerPanel = observer(() => {
  const [value, setValue] = useState(0);
  // const { setStrokeWith } = useContext(ToolbarUIContext);
  const handleChange = (value: number) => {
    setValue(value);
  };

  return (
    <div
      className="fcr-board-toolba-panel"
      style={{
        width: 152,
        height: 120,
      }}>
      <div style={{ padding: '20px 8px' }}>
        <HorizontalSlider value={value} onChange={setValue} />
        <div
          className="fcr-board-toolbar-divider"
          style={{ borderTop: '1px solid #4a4c5f', marginTop: 22, marginBottom: 10 }}
        />
        <div
          className="fcr-board-toolbar-pen-type"
          style={{
            display: 'flex',
          }}>
          <div
            className="fcr-board-toolbar__pen-straight"
            style={{
              width: 65,
              height: 30,
              display: 'flex',
              justifyContent: 'center',
              border: '2px solid #4262FF',
              flexGrow: 1,
              flexShrink: 0,
              marginRight: 6,
              borderRadius: 12,
              cursor: 'pointer',
            }}>
            <SvgImg
              type={SvgIconEnum.FCR_PEN_LINE_3SIZE}
              size={30}
              style={{
                marginTop: -2,
              }}
            />
          </div>
          <div
            className="fcr-board-toolbar__pen-curve"
            style={{
              width: 65,
              height: 30,
              display: 'flex',
              justifyContent: 'center',
              border: '1px solid #4A4C5F',
              flexGrow: 1,
              flexShrink: 0,
              borderRadius: 12,
              cursor: 'pointer',
            }}>
            <SvgImg
              type={SvgIconEnum.FCR_PEN_CURVE_3SIZE}
              size={30}
              style={{
                marginTop: -2,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

const ShapePickerPanel = () => {
  return <div />;
};
const EraserPickerPanel = () => {
  return <div />;
};
const ScreenCapturePickerPanel = () => {
  return <div />;
};
