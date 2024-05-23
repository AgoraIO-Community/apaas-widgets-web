import { FC, useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { ExpansionToolbarItem, ExpansionFixbarItem } from '.';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import classNames from 'classnames';
import { ColorPickerItem, ColorToolPickerItem } from './color-picker';
import { FcrBoardShape, FcrBoardTool } from '../../../../common/whiteboard-wrapper/type';
import { ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';

const penIconMap = {
  [FcrBoardShape.Straight]: SvgIconEnum.FCR_PENSIZE2_STRAIGHT,
  [FcrBoardShape.Curve]: SvgIconEnum.FCR_PENSIZE2,
};

export const PenPickerItem: FC<{ offset?: number }> = observer(({ offset }) => {
  const {
    observables: { currentShape, lastPen, currentTool, currentColor },
    setPen,
    setTool,
  } = useContext(ToolbarUIContext);
  const transI18n = useI18n();
  const handlePenToolChange = (shapeTool: FcrBoardShape) => {
    return () => {
      setPen(shapeTool);
    };
  };
  const [toolVisible, setToolVisible] = useState(false);
  const toggleTooltipVisible = () => setToolVisible((prev) => !prev);
  const isActive = currentShape === FcrBoardShape.Curve || currentShape === FcrBoardShape.Straight;

  const icon = lastPen
    ? penIconMap[lastPen as keyof typeof penIconMap]
    : SvgIconEnum.FCR_MOBILE_WHITEBOARD_PED_LINE;
  const clickShape = lastPen ? lastPen : FcrBoardShape.Curve;

  return (
    <ExpansionFixbarItem
      getTooltipContainer={() =>
        document.querySelector('#fcr_board_center_position') as HTMLElement
      }
      isActive={isActive}
      toolVisible={toolVisible}
      setToolVisible={toggleTooltipVisible}
      tooltip={transI18n('fcr_board_tool_pen')}
      icon={icon}
      onClick={handlePenToolChange(clickShape)}
      tooltipPlacement={'top'}
      popoverPlacement={'top'}
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay fcr-board-toolbar__fixedbottom"
      popoverContent={<PenPickerPanel handleClose={toggleTooltipVisible} />}
      popoverOffset={offset}
      iconProps={{ colors: { iconPrimary: currentColor } }}
      texttip={transI18n('fcr_board_tool_pen')}
    />
  );
});

const PenPickerPanel = observer(({ handleClose }: any) => {
  const { observables, setPen } = useContext(ToolbarUIContext);
  const pens = [
    { type: FcrBoardShape.Straight, icon: SvgIconEnum.FCR_PENSIZE2_STRAIGHT },
    { type: FcrBoardShape.Curve, icon: SvgIconEnum.FCR_PENSIZE2 },
  ];

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--pen">
      {pens.map(({ type, icon }) => {
        const cls = classNames({
          'fcr-board-toolbar-panel--active': observables.currentShape === type,
        });
        const handleClick = () => {
          setPen(type);
        };
        return (
          <div key={type} className={cls} onClick={handleClick}>
            <SvgImg type={icon} size={28} />
          </div>
        );
      })}

      <div className="fcr-divider-vertical fcr-divider-mobile-line"></div>
      <PenToolPickerItem />

      <div className="fcr-divider-vertical fcr-divider-mobile-line"></div>
      <ColorToolPickerItem />
      <div className="fcr-divider-vertical fcr-divider-mobile-line"></div>
      <div key="close" onClick={handleClose}>
        <SvgImg type={SvgIconEnum.FCR_MOBILE_CLOSE} size={16} />
      </div>
    </div>
  );
});

const PenWeightsItem = observer(() => {
  const { observables, setStrokeWidth } = useContext(ToolbarUIContext);

  const weights = [
    {
      value: 1,
      icon: SvgIconEnum.FCR_MOBILE_PEN_CURVE_1SIZE,
    },
    {
      value: 2,
      icon: SvgIconEnum.FCR_MOBILE_PEN_CURVE_2SIZE,
    },
    {
      value: 3,
      icon: SvgIconEnum.FCR_MOBILE_PEN_CURVE_3SIZE,
    },
    {
      value: 4,
      icon: SvgIconEnum.FCR_MOBILE_PEN_CURVE_4SIZE,
    },
  ];

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--pen">
      {weights.map(({ value, icon }) => {
        const cls = classNames({
          'fcr-board-toolbar-panel--strokeactive': observables.currentStrokeWidth === value,
        });
        const handleClick = () => {
          setStrokeWidth(value);
        };
        return (
          <div key={value} className={cls} onClick={handleClick}>
            <SvgImg type={icon} size={28} />
          </div>
        );
      })}
    </div>
  );
});

export const PenToolPickerItem = observer(() => {
  const {
    observables: { currentShape, lastShape, currentColor, currentStrokeWidth },
    setPen,
    setStrokeWidth,
  } = useContext(ToolbarUIContext);
  const transI18n = useI18n();

  const handlePenToolChange = (shapeTool: FcrBoardShape) => {
    return () => {
      setPen(shapeTool);
    };
  };

  const isActive = false;
  const clickShape = lastShape ? lastShape : FcrBoardShape.Curve;

  const penIcon =
    currentStrokeWidth === 1
      ? SvgIconEnum.FCR_MOBILE_PEN_CURVE_1SIZE
      : currentStrokeWidth === 2
      ? SvgIconEnum.FCR_MOBILE_PEN_CURVE_2SIZE
      : currentStrokeWidth === 3
      ? SvgIconEnum.FCR_MOBILE_PEN_CURVE_3SIZE
      : SvgIconEnum.FCR_MOBILE_PEN_CURVE_4SIZE;

  return (
    <ExpansionToolbarItem
      isActive={isActive}
      tooltip={transI18n('fcr_board_tool_extra')}
      icon={penIcon}
      onClick={handlePenToolChange(clickShape)}
      tooltipPlacement="top"
      popoverPlacement="top"
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverContent={<PenWeightsItem />}
      // iconProps={{ colors: { iconPrimary: currentColor } }}
      extensionMark={false}
    />
  );
});
