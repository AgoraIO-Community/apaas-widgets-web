import { observer } from 'mobx-react';
import React, { FC, useContext } from 'react';
import { Popover } from '@components/popover';
import classNames from 'classnames';
import { ToolbarUIContext } from '../ui-context';
import { useVisibleTools } from './hooks';

const colors = ['#fed130', '#fc3141'];

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

  const isDisabled = !currentShape;

  const cls = classNames('fcr-board-toolbar__color-item fcr-board-toolbar__color-item--picker', {
    'fcr-board-toolbar__color-item--active': isOtherColorActive,
    'fcr-board-toolbar__color-item--disabled': isDisabled,
  });

  return isDisabled ? (
    <div className={cls} />
  ) : (
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

  const colors = [
    '#EFEFEF',
    '#FFEC42',
    '#FFB545',
    '#E44A19',
    '#4A4C5F',
    '#A1C573',
    '#51BD69',
    '#EB47A2',
    '#0E0E0E',
    '#50E3C2',
    '#547AFF',
    '#79479F',
  ];
  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--color">
      {colors.map((color) => {
        const isActive = currentColor === color;

        const cls = classNames({
          'fcr-board-toolbar__picker-color--active': isActive,
        });

        const handleClick = () => {
          setStrokeColor(color);
        };
        return (
          <div
            key={color}
            className={cls}
            onClick={handleClick}
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
