import { FC, useContext, useState } from 'react';
import { observer } from 'mobx-react';
import { ExpansionToolbarItem, ExpansionFixbarItem } from '.';
import { SvgIconEnum, SvgImg } from './../../../../../../fcr-ui-kit/src/components/svg-img';
import classNames from 'classnames';
import { FcrBoardShape } from '../../../../common/whiteboard-wrapper/type';
import { ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';
import { PenToolPickerItem } from './pen-picker';
import { ColorToolPickerItem } from './color-picker';

const shapeIconMap = {
  [FcrBoardShape.Arrow]: SvgIconEnum.FCR_WHITEBOARD_SHAP_ARROW,
  [FcrBoardShape.Ellipse]: SvgIconEnum.FCR_WHITEBOARD_SHAP_CIRCLE,
  [FcrBoardShape.Pentagram]: SvgIconEnum.FCR_WHITEBOARD_SHAP_STAR,
  [FcrBoardShape.Rectangle]: SvgIconEnum.FCR_WHITEBOARD_SHAP_SQUARE,
  [FcrBoardShape.Rhombus]: SvgIconEnum.FCR_WHITEBOARD_SHAP_REHUMBUS,
  [FcrBoardShape.Triangle]: SvgIconEnum.FCR_WHITEBOARD_SHAP_TRIANGLE,
};

export const ShapePickerItem: FC<{ offset?: number }> = observer(({ offset }) => {
  const {
    observables: { toolbarDockPosition, currentShape, lastShape, currentColor },
    setShape,
  } = useContext(ToolbarUIContext);
  const transI18n = useI18n();
  const handleShapeToolChange = (shapeTool: FcrBoardShape) => {
    return () => {
      setShape(shapeTool);
    };
  };
  const [toolVisible, setToolVisible] = useState(false);
  const toggleTooltipVisible = () => setToolVisible((prev) => !prev);

  const isActive =
    !!currentShape &&
    [
      FcrBoardShape.Arrow,
      FcrBoardShape.Ellipse,
      FcrBoardShape.Pentagram,
      FcrBoardShape.Rectangle,
      FcrBoardShape.Rhombus,
      FcrBoardShape.Triangle,
    ].includes(currentShape);

  const icon = lastShape
    ? shapeIconMap[lastShape as keyof typeof shapeIconMap]
    : SvgIconEnum.FCR_MOBILE_WHITEBOARD_PED_CURVE;
  const clickShape = lastShape ? lastShape : FcrBoardShape.Ellipse;

  return (
    <ExpansionFixbarItem
      getTooltipContainer={() =>
        document.querySelector('#fcr_board_center_position') as HTMLElement
      }
      isActive={isActive}
      tooltip={transI18n('fcr_board_tool_shape')}
      icon={icon}
      toolVisible={toolVisible}
      setToolVisible={toggleTooltipVisible}
      onClick={handleShapeToolChange(clickShape)}
      tooltipPlacement={'top'}
      popoverPlacement={'top'}
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay  fcr-board-toolbar__fixedbottom"
      popoverContent={<ShapePickerPanel handleClose={toggleTooltipVisible} />}
      popoverOffset={offset}
      iconProps={{ colors: { iconPrimary: currentColor } }}
      texttip={transI18n('fcr_board_tool_shape')}
    />
  );
});

const ShapePickerPanel = observer(({ handleClose }: any) => {
  const { observables, setShape, setStrokeWidth } = useContext(ToolbarUIContext);
  const shapes = [
    { type: FcrBoardShape.Rectangle, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_SQUARE },
    { type: FcrBoardShape.Rhombus, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_REHUMBUS },
    { type: FcrBoardShape.Ellipse, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_CIRCLE },
    { type: FcrBoardShape.Triangle, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_TRIANGLE },
    { type: FcrBoardShape.Pentagram, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_STAR },
    // { type: FcrBoardShape.Arrow, icon: SvgIconEnum.FCR_WHITEBOARD_SHAP_ARROW },
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
            <SvgImg type={icon} size={28} />
          </div>
        );
      })}
      <div className="fcr-divider-vertical fcr-divider-mobile-line"></div>
      <PenToolPickerItem />

      <div className="fcr-divider-vertical fcr-divider-mobile-line"></div>
      <ColorToolPickerItem />
      <div className="fcr-divider-vertical fcr-divider-mobile-line"></div>
      <div onClick={handleClose}>
        <SvgImg type={SvgIconEnum.FCR_MOBILE_CLOSE} size={16} />
      </div>
    </div>
  );
});
