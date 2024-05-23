import { FC, useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { ExpansionToolbarItem, ExpansionFixbarItem } from '.';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import classNames from 'classnames';
import { ColorPickerItem, ColorToolPickerItem } from './color-picker';
import { FcrBoardShape, FcrBoardTool } from '../../../../common/whiteboard-wrapper/type';
import { ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';
import { runInAction } from 'mobx';

const penIconMap = {
  [FcrBoardShape.Straight]: SvgIconEnum.FCR_PENSIZE2_STRAIGHT,
  [FcrBoardShape.Curve]: SvgIconEnum.FCR_PENSIZE2,
};

export const PenPickerItem: FC<{ offset?: number }> = observer(({ offset }) => {
  const {
    observables,
    observables: { currentShape, lastPen, fixedToolVisible, currentColor },
    setPen,
    setTool,
  } = useContext(ToolbarUIContext);
  const transI18n = useI18n();
  const handlePenToolChange = (shapeTool: FcrBoardShape) => {
    runInAction(() => {
      observables.fixedToolVisible = true;
    });
    return () => {
      setPen(shapeTool);
    };
  };
  const isActive = currentShape === FcrBoardShape.Curve || currentShape === FcrBoardShape.Straight;

  const icon = lastPen
    ? penIconMap[lastPen as keyof typeof penIconMap]
    : SvgIconEnum.FCR_MOBILE_WHITEBOARD_PED_LINE;
  const clickShape = lastPen ? lastPen : FcrBoardShape.Curve;

  const cls = classNames('fcr-board-toolbar-item-surrounding', {
    'fcr-board-toolbar-item-surrounding--active': isActive,
  });

  return (
    <div className={cls} onClick={handlePenToolChange(clickShape)}>
      <SvgImg
        colors={{ iconPrimary: isActive && currentColor ? currentColor : 'white' }}
        type={icon}
        size={28}
      />
      <div className="fcr-board-toolbar-item__texttip">{transI18n('fcr_board_tool_pen')}</div>
    </div>
  );
});

export const PenPickerPanel = observer(() => {
  const { observables, setPen } = useContext(ToolbarUIContext);
  const pens = [
    { type: FcrBoardShape.Straight, icon: SvgIconEnum.FCR_PENSIZE2_STRAIGHT },
    { type: FcrBoardShape.Curve, icon: SvgIconEnum.FCR_PENSIZE2 },
  ];
  const handleClose = () => {
    runInAction(() => {
      observables.fixedToolVisible = false;
    });
  };

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
