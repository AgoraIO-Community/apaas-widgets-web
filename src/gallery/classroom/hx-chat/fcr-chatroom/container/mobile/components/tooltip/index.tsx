import RcToolTip from 'rc-tooltip';
import { CSSMotionProps } from 'rc-motion';
import { CSSProperties, FC, ReactElement, ReactNode } from 'react';
import './index.css';
import './arrow.css';
import { SvgIconEnum, SvgImg } from '../../../../../../../../components/svg-img';

const calcOverlayOffset = (placement: string, offset: number) => {
  if (placement.includes('top')) {
    return [0, -offset];
  }
  if (placement.includes('bottom')) {
    return [0, offset];
  }
  if (placement.includes('left')) {
    return [-offset, 0];
  }
  if (placement.includes('right')) {
    return [offset, 0];
  }
};

type ToolTipActionType = 'hover' | 'focus' | 'click' | 'contextMenu';
export interface ToolTipProps {
  /**
   * 卡片内容
   */
  /** @en
   * Size of the input box:
   * medium
   * large
   */
  content?: ReactNode;
  /**
   * 触发行为，可选 hover | focus | click | contextMenu
   */
  /** @en
   * Size of the input box:
   * medium
   * large
   */

  trigger?: ToolTipActionType;
  /**
   * 气泡框位置，可选 top left right bottom topLeft topRight bottomLeft bottomRight leftTop leftBottom rightTop rightBottom
   */
  /** @en
   * Size of the input box:
   * medium
   * large
   */
  placement?:
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'leftTop'
    | 'leftBottom'
    | 'rightTop'
    | 'rightBottom';
  /**
   * 自定义箭头
   */
  /** @en
   * Size of the input box:
   * medium
   * large
   */
  arrowContent?: ReactNode;
  /**
   * 卡片内容区域的样式对象
   */
  /** @en
   * Size of the input box:
   * medium
   * large
   */
  overlayInnerStyle?: CSSProperties;
  /**
   * 气泡的显示状态
   */
  /** @en
   * Size of the input box:
   * medium
   * large
   */
  visible?: boolean;
  /**
   * 卡片类名
   */
  /** @en
   * Size of the input box:
   * medium
   * large
   */
  overlayClassName?: string;
  /**
   * 修改箭头的显示状态
   */
  /** @en
   * Size of the input box:
   * medium
   * large
   */
  showArrow?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  motion?: CSSMotionProps;
  getTooltipContainer?: (node: HTMLElement) => HTMLElement;
  children?: React.ReactNode;
  mouseEnterDelay?: number;
  overlayOffset?: number;
  mouseLeaveDelay?: number;
  afterVisibleChange?: (visible: boolean) => void;
}

export const ToolTip: FC<ToolTipProps> = (props) => {
  const {
    content,
    children,
    trigger,
    placement = 'top',
    arrowContent,
    overlayInnerStyle,
    overlayClassName,
    showArrow = true,
    onVisibleChange,
    motion,
    getTooltipContainer,
    mouseEnterDelay,
    mouseLeaveDelay,
    overlayOffset = 12,
    afterVisibleChange,
    ...others
  } = props;

  const defaultOverlayInnerStyle: CSSProperties = {
    padding: '0 10px',
    background: `#000`,
    border: `1px solid #4A4C5F`,
    fontStyle: 'normal',
    fontWeight: '300',
    fontSize: '14px',
    lineHeight: '32px',
    color: `#fff`,
    borderRadius: `8px`,
    width: 'max-content',
  };

  return (
    <RcToolTip
      destroyTooltipOnHide
      afterVisibleChange={afterVisibleChange}
      mouseLeaveDelay={mouseLeaveDelay}
      mouseEnterDelay={mouseEnterDelay ?? 1}
      getTooltipContainer={getTooltipContainer}
      onVisibleChange={onVisibleChange}
      prefixCls="fcr-tooltip"
      overlayClassName={overlayClassName}
      arrowContent={
        showArrow === false
          ? null
          : arrowContent || (
              <SvgImg
                type={SvgIconEnum.FCR_TOOLTIP_ARROW}
                colors={{
                  iconPrimary: `#000`,
                  iconSecondary: `#4A4C5F`,
                }}
                size={16}></SvgImg>
            )
      }
      align={{ offset: calcOverlayOffset(placement, overlayOffset) }}
      trigger={trigger}
      placement={placement}
      overlay={content}
      overlayInnerStyle={{ ...defaultOverlayInnerStyle, ...overlayInnerStyle }}
      motion={
        motion || {
          motionAppear: true,
          motionName: 'fcr-tooltip-anim',
        }
      }
      {...others}>
      {(children as ReactElement) || <></>}
    </RcToolTip>
  );
};
