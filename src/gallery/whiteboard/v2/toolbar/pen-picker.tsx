import { FC, useContext } from 'react';
import { observer } from 'mobx-react';
import { ExpansionToolbarItem } from '.';
import { ToolbarUIContext } from '../../ui-context';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { HorizontalSlider } from '@components/slider';
import { FcrBoardShape } from '../../wrapper/type';
import classNames from 'classnames';
import { ToolTip } from '@components/tooltip';

export const PenPickerItem: FC = observer(() => {
  const {
    observables: { currentShape },
  } = useContext(ToolbarUIContext);

  const isActive = currentShape === FcrBoardShape.Curve || currentShape === FcrBoardShape.Straight;

  return (
    <ExpansionToolbarItem
      isActive={isActive}
      tooltip="Pen"
      icon={SvgIconEnum.FCR_WHITEBOARD_PED_CURVE}
      popoverPlacement="right"
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverContent={<PenPickerPanel />}
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
