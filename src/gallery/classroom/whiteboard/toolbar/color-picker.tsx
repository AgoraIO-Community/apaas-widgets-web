import { observer } from 'mobx-react';
import React, { FC, useContext } from 'react';
import { Popover } from '@components/popover';
import classNames from 'classnames';
import { ToolbarUIContext } from '../ui-context';
import { useVisibleTools } from './hooks';
import { ExpansionToolbarItem } from '.';
import { useI18n } from 'agora-common-libs';
import { FcrBoardShape } from '../../../../common/whiteboard-wrapper/type';
import { SvgIconEnum } from '@components/svg-img';

const colors = ['#fed130', '#fc3141'];

const shapeIconMap = {
  [FcrBoardShape.Arrow]: SvgIconEnum.FCR_WHITEBOARD_SHAP_ARROW,
  [FcrBoardShape.Ellipse]: SvgIconEnum.FCR_WHITEBOARD_SHAP_CIRCLE,
  [FcrBoardShape.Pentagram]: SvgIconEnum.FCR_WHITEBOARD_SHAP_STAR,
  [FcrBoardShape.Rectangle]: SvgIconEnum.FCR_WHITEBOARD_SHAP_SQUARE,
  [FcrBoardShape.Rhombus]: SvgIconEnum.FCR_WHITEBOARD_SHAP_REHUMBUS,
  [FcrBoardShape.Triangle]: SvgIconEnum.FCR_WHITEBOARD_SHAP_TRIANGLE,
};

export const ColorToolPickerItem = observer(({ origin }: any) => {
  const transI18n = useI18n();
  const {
    observables: { lastShape, currentTool, currentColor, currentShape },
    setShape,
  } = useContext(ToolbarUIContext);
  const handleShapeToolChange = (shapeTool: FcrBoardShape) => {
    return () => {
      if (origin === 'pen') return;
      setShape(shapeTool);
    };
  };

  const isActive = false;
  const clickShape = lastShape ? lastShape : FcrBoardShape.Ellipse;

  return (
    <ExpansionToolbarItem
      isActive={isActive}
      onClick={handleShapeToolChange(clickShape)}
      icon={SvgIconEnum.FCR_MOBILE_COLOR_SIZE}
      tooltipPlacement="top"
      popoverPlacement="top"
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverOffset={12}
      overlayInnerStyle={{
        width: 'fit-content',
        background: 'var(--fcr_mobile_ui_scene_color_popup_block1, #FFFFFFF2)',
        borderRadius: '6px',
        paddingTop: '2.5px',
        border: '0.5px solid var(--fcr_ui_scene_line1, #E3E7EF)',
      }}
      popoverContent={<ColorPickerPanel />}
      iconProps={{ colors: { iconPrimary: currentColor } }}
      extensionMark={false}
    />
  );
});

export const ColorPickerItem: FC = observer(() => {
  const { showColorCount, isShinked } = useVisibleTools();

  let list = [];
  if (!isShinked) {
    list = colors
      .map((color) => <Color value={color} key={color} />)
      .slice(0, Math.min(showColorCount - colors.length + 1, colors.length));

    if (showColorCount > 0) {
      list.push(<Picker key="picker" />);
    }
  } else {
    list = [<Picker key="picker" />];
  }

  return <div className="fcr-board-toolbar__color-items">{list}</div>;
});

const Color: FC<{ value: string }> = observer(({ value }) => {
  const {
    observables: { currentColor, currentShape },
    setStrokeColor,
  } = useContext(ToolbarUIContext);

  const isActive = currentColor === value;
  const isDisabled = !currentShape;

  const cls = classNames('fcr-board-toolbar__color-item', {
    'fcr-board-toolbar__color-item--active': isActive,
    'fcr-board-toolbar__color-item--disabled': isDisabled,
  });

  const handleClick = () => {
    setStrokeColor(value);
  };

  const style = {
    backgroundColor: value,
  };

  return <div className={cls} onClick={isDisabled ? undefined : handleClick} style={style} />;
});

const Picker = observer(() => {
  const {
    observables: { currentColor, currentShape, toolbarDockPosition },
  } = useContext(ToolbarUIContext);

  const isOtherColorActive = !!currentColor && !colors.includes(currentColor);

  const cls = classNames('fcr-board-toolbar__color-item fcr-board-toolbar__color-item--picker', {
    'fcr-board-toolbar__color-item--active': isOtherColorActive,
    // 'fcr-board-toolbar__color-item--disabled': isDisabled,
  });

  return (
    <Popover
      content={<ColorPickerPanel />}
      trigger="click"
      placement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      overlayClassName="fcr-board-toolbar__picker__overlay"
      overlayOffset={18}>
      <div className={cls} />
    </Popover>
  );
});

const ColorPickerPanel = observer(() => {
  const {
    observables: { currentColor },
    setStrokeColor,
  } = useContext(ToolbarUIContext);

  const colors = ['#51BD69', '#E44A19', '#FFEC42', '#547AFF', '#4A4C5F'];

  const handleClick = (color: string) => {
    setStrokeColor(color);
  };
  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--color">
      {colors.map((color) => {
        const isActive = currentColor === color;

        const cls = classNames({
          'fcr-board-toolbar__picker-color--active': isActive,
        });

        return (
          <div
            key={color}
            className={cls}
            onClick={() => handleClick(color)}
            style={{
              color,
              background: color,
            }}
          />
        );
      })}
    </div>
  );
});
