import { observer } from 'mobx-react';
import React, { FC, useContext } from 'react';
import { ToolbarUIContext } from '../../ui-context';
import { Popover } from '@components/popover';
import classNames from 'classnames';

export const ColorPickerItem: FC = observer(() => {
  const {
    observables: { currentColor },
    setStrokeColor,
  } = useContext(ToolbarUIContext);

  const colors = ['#fed130', '#4262ff', '#fc3141'];

  const isOtherColorActive = !!currentColor && !colors.includes(currentColor);

  const cls = classNames('fcr-board-toolbar__color-item', {
    'fcr-board-toolbar__color-item--active': isOtherColorActive,
  });

  return (
    <div className="fcr-board-toolbar__color-items">
      {colors.map((color) => {
        const isActive = currentColor === color;

        const cls = classNames('fcr-board-toolbar__color-item', {
          'fcr-board-toolbar__color-item--active': isActive,
        });

        const handleClick = () => {
          setStrokeColor(color);
        };

        return <div key={color} className={cls} onClick={handleClick} />;
      })}
      <Popover
        content={<ColorPickerPanel />}
        trigger="click"
        placement="right"
        overlayClassName="fcr-board-toolbar__picker__overlay">
        <div className={cls} />
      </Popover>
    </div>
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
