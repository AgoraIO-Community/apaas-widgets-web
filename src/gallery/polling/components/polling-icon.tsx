import { FC } from 'react';
import classnames from 'classnames';
import './polling-icon.css';
import { SvgIconEnum, SvgImg } from '@components/svg-img';

interface PollingIconProps {
  icon: SvgIconEnum;
  iconSize?: number;
  disabled?: boolean;
  classNames?: string;
  onClick?: () => void;
}
export const PollingIcon: FC<PollingIconProps> = (props) => {
  const { icon, classNames, onClick, disabled, ...otherProps } = props;

  return (
    <button
      {...otherProps}
      disabled={disabled}
      onClick={onClick}
      className={classnames(
        'fcr-polling-icon',
        `fcr-polling-icon-style`,
        'fcr-btn-click-effect',
        classNames,
      )}>
      <SvgImg type={icon} size={36} colors={{ iconPrimary: 'currentColor' }}></SvgImg>
    </button>
  );
};
