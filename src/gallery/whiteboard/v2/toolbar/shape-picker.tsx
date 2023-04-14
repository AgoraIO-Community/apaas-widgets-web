import { FC, useContext } from 'react';
import { observer } from 'mobx-react';
import { ExpansionToolbarItem } from '.';
import { ToolbarUIContext } from '../../ui-context';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { FcrBoardShape } from '../../wrapper/type';
import classNames from 'classnames';

const shapeIconMap = {
  [FcrBoardShape.Arrow]: SvgIconEnum.FCR_WHITEBOARD_SHAP_ARROW,
  [FcrBoardShape.Ellipse]: SvgIconEnum.FCR_WHITEBOARD_SHAP_CIRCLE,
  [FcrBoardShape.Pentagram]: SvgIconEnum.FCR_WHITEBOARD_SHAP_STAR,
  [FcrBoardShape.Rectangle]: SvgIconEnum.FCR_WHITEBOARD_SHAP_SQUARE,
  [FcrBoardShape.Rhombus]: SvgIconEnum.FCR_WHITEBOARD_SHAP_REHUMBUS,
  [FcrBoardShape.Triangle]: SvgIconEnum.FCR_WHITEBOARD_SHAP_TRIANGLE,
};

export const ShapePickerItem: FC = observer(() => {
  const { observables, setShape } = useContext(ToolbarUIContext);
  const handleShapeToolChange = (shapeTool: FcrBoardShape) => {
    return () => {
      setShape(shapeTool);
    };
  };

  const isActive =
    !!observables.currentShape &&
    [
      FcrBoardShape.Arrow,
      FcrBoardShape.Ellipse,
      FcrBoardShape.Pentagram,
      FcrBoardShape.Rectangle,
      FcrBoardShape.Rhombus,
      FcrBoardShape.Triangle,
    ].includes(observables.currentShape);

  const icon = observables.lastShape
    ? shapeIconMap[observables.lastShape as keyof typeof shapeIconMap]
    : SvgIconEnum.FCR_WHITEBOARD_SHAP_CIRCLE;
  const clickShape = observables.lastShape ? observables.lastShape : FcrBoardShape.Ellipse;

  return (
    <ExpansionToolbarItem
      isActive={isActive}
      tooltip="Shape"
      icon={icon}
      onClick={handleShapeToolChange(clickShape)}
      popoverPlacement="right"
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverContent={<ShapePickerPanel />}
    />
  );
});

const ShapePickerPanel = observer(() => {
  const { observables, setShape } = useContext(ToolbarUIContext);
  const shapes = [
    { type: FcrBoardShape.Rectangle, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_SQUARE },
    { type: FcrBoardShape.Ellipse, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_CIRCLE },
    { type: FcrBoardShape.Pentagram, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_STAR },
    { type: FcrBoardShape.Triangle, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_TRIANGLE },
    { type: FcrBoardShape.Rhombus, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_REHUMBUS },
    { type: FcrBoardShape.Arrow, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_ARROW },
  ];

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--shape">
      {shapes.map(({ type, icon }) => {
        const cls = classNames({
          'fcr-board-toolbar-panel--active': observables.currentShape === type,
        });
        const handleClick = () => {
          setShape(type);
        };
        return (
          <div key={type} className={cls} onClick={handleClick}>
            <SvgImg type={icon} size={30} />
          </div>
        );
      })}
    </div>
  );
});
