import { FC, useContext } from 'react';
import { observer } from 'mobx-react';
import { ExpansionToolbarItem } from '.';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { HorizontalSlider } from '@components/slider';
import classNames from 'classnames';
import { ToolTip } from '@components/tooltip';
import { FcrBoardShape } from '../../../common/whiteboard-wrapper/type';
import { ToolbarUIContext } from '../ui-context';

const penIconMap = {
  [FcrBoardShape.Curve]: SvgIconEnum.FCR_WHITEBOARD_PED_CURVE,
  [FcrBoardShape.Straight]: SvgIconEnum.FCR_WHITEBOARD_PED_STRAIGHTLINE,
};

export const PenPickerItem: FC<{ offset?: number }> = observer(({ offset }) => {
  const {
    observables: { currentShape, lastPen, toolbarDockPosition },
    setPen,
  } = useContext(ToolbarUIContext);

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
      tooltip="Pen"
      icon={icon}
      onClick={handlePenToolChange(clickShape)}
      popoverPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverContent={<PenPickerPanel />}
      popoverOffset={offset}
    />
  );
});

const PenPickerPanel = observer(() => {
  const { observables, setPen, setStrokeWidth } = useContext(ToolbarUIContext);

  const handleChange = (value: number) => {
    setStrokeWidth(value);
  };

  const handlePenTypeChange = (shape: FcrBoardShape) => {
    return () => {
      setPen(shape);
    };
  };

  const straightCls = classNames({
    'fcr-board-toolbar-panel__pen-type--active':
      observables.currentShape === FcrBoardShape.Straight,
  });

  const curveCls = classNames({
    'fcr-board-toolbar-panel__pen-type--active': observables.currentShape === FcrBoardShape.Curve,
  });

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--pen">
      <HorizontalSlider value={observables.currentStrokeWidth} onChange={handleChange} />
      <div className="fcr-board-toolbar-panel__divider" />
      <div className="fcr-board-toolbar-panel__pen-type">
        <ToolTip content="直线" placement="bottom">
          <div className={straightCls} onClick={handlePenTypeChange(FcrBoardShape.Straight)}>
            <SvgImg type={SvgIconEnum.FCR_PEN_LINE_3SIZE} size={30} />
          </div>
        </ToolTip>
        <ToolTip content="曲线" placement="bottom">
          <div className={curveCls} onClick={handlePenTypeChange(FcrBoardShape.Curve)}>
            <SvgImg type={SvgIconEnum.FCR_PEN_CURVE_3SIZE} size={30} />
          </div>
        </ToolTip>
      </div>
    </div>
  );
});
