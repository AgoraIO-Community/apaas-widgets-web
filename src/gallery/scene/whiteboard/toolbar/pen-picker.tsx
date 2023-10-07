import { FC, useContext } from 'react';
import { observer } from 'mobx-react';
import { ExpansionToolbarItem } from '.';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import classNames from 'classnames';
import { FcrBoardShape } from '../../../../common/whiteboard-wrapper/type';
import { ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';

const penIconMap = {
  [FcrBoardShape.Curve]: SvgIconEnum.FCR_WHITEBOARD_PED_CURVE,
  [FcrBoardShape.Straight]: SvgIconEnum.FCR_WHITEBOARD_PED_STRAIGHTLINE,
};

export const PenPickerItem: FC<{ offset?: number }> = observer(({ offset }) => {
  const {
    observables: { currentShape, lastPen, toolbarDockPosition, currentColor },
    setPen,
  } = useContext(ToolbarUIContext);
  const transI18n = useI18n();
  const handlePenToolChange = (shapeTool: FcrBoardShape) => {
    return () => {
      setPen(shapeTool);
    };
  };

  const isActive = currentShape === FcrBoardShape.Curve || currentShape === FcrBoardShape.Straight;

  const icon = lastPen
    ? penIconMap[lastPen as keyof typeof penIconMap]
    : SvgIconEnum.FCR_WHITEBOARD_PED_CURVE;
  const clickShape = lastPen ? lastPen : FcrBoardShape.Curve;

  return (
    <ExpansionToolbarItem
      isActive={isActive}
      tooltip={transI18n('fcr_board_tool_pen')}
      icon={icon}
      onClick={handlePenToolChange(clickShape)}
      tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      popoverPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverContent={<PenPickerPanel />}
      popoverOffset={offset}
      iconProps={{ colors: { iconSecondary: currentColor } }}
    />
  );
});

const PenPickerPanel = observer(() => {
  const { observables, setPen, setStrokeWidth } = useContext(ToolbarUIContext);

  const pens = [
    { type: FcrBoardShape.Straight, icon: SvgIconEnum.FCR_WHITEBOARD_PED_STRAIGHTLINE },
    { type: FcrBoardShape.Curve, icon: SvgIconEnum.FCR_WHITEBOARD_PED_CURVE },
  ];

  const isCurve = observables.currentShape === FcrBoardShape.Curve;

  const weights = [
    { value: 1, icon: isCurve ? SvgIconEnum.FCR_PEN_CURVE_1SIZE : SvgIconEnum.FCR_PEN_LINE_1SIZE },
    { value: 2, icon: isCurve ? SvgIconEnum.FCR_PEN_CURVE_2SIZE : SvgIconEnum.FCR_PEN_LINE_2SIZE },
    { value: 3, icon: isCurve ? SvgIconEnum.FCR_PEN_CURVE_3SIZE : SvgIconEnum.FCR_PEN_LINE_3SIZE },
    { value: 4, icon: isCurve ? SvgIconEnum.FCR_PEN_CURVE_4SIZE : SvgIconEnum.FCR_PEN_LINE_4SIZE },
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
      <div className="fcr-divider-vertical fcr-divider-marign-bottom"></div>
      {weights.map(({ value, icon }) => {
        const cls = classNames({
          'fcr-board-toolbar-panel--active': observables.currentStrokeWidth === value,
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
