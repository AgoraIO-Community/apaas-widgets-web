import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { runInAction } from 'mobx';
import { Dialog } from 'antd-mobile';
import { useI18n } from 'agora-common-libs';
import './slide.css';
import { ToolbarUIContext } from '../../ui-context';

interface CleanSimpleVerifyProps {
  width: number;
  tips: string;
  verify?: () => void;
}

interface CleanSimpleVerifyState {
  isMouseEnter: boolean;
  diff: number;
  slideWidth: number;
}

export default class CleanSimpleVerify extends React.Component<
  CleanSimpleVerifyProps,
  CleanSimpleVerifyState
> {
  static defaultProps = {
    width: 209,
    tips: '滑动清除所有',
  };

  /** x */
  private x1 = 0;
  private x2 = 0;
  /** 鼠标是否按下 */
  private isMousedown = false;
  /** 是否已经成功 */
  private isSuccess = false;
  /** 最大滑动距离 */
  private max = this.props.width - 42 - 3;
  /** 盒子样式 */
  private style = {
    width: this.props.width,
  };
  // private slideWidth = 0;
  private currentObs: any;

  public reset = () => {
    this.isSuccess = false;
    this.setState({
      diff: 0,
    });
    setTimeout(() => {
      this.isMousedown = false;
      this.setState({
        isMouseEnter: false,
      });
    }, 0);
  };

  constructor(props: CleanSimpleVerifyProps) {
    super(props);
    this.state = {
      /** 是否滑入 */
      isMouseEnter: false,
      /** 滑动距离 */
      diff: 0,
      slideWidth: 0,
    };
  }

  /**
   * 绑定事件
   */
  public componentDidMount() {
    this.currentObs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 获取高度
            this.setState({
              slideWidth: entry.target.clientHeight,
            });
            // 停止观察
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 1 }, // 触发阈值，可以根据需要调整
    );

    this.currentObs.observe(document.querySelector('.veriry-slide'));

    document.body.addEventListener('mousemove', this.mousemove.bind(this));
    document.body.addEventListener('touchmove', this.mousemove.bind(this));
    document.body.addEventListener('mouseup', this.mouseup.bind(this));
    document.body.addEventListener('touchend', this.mouseup.bind(this));
  }

  /**
   * 移除事件
   */
  public componentWillUnmount() {
    this.currentObs && this.currentObs.unobserve(document.querySelector('.veriry-slide'));
    document.body.removeEventListener('mousemove', this.mousemove.bind(this));
    document.body.removeEventListener('touchmove', this.mousemove.bind(this));
    document.body.removeEventListener('mouseup', this.mouseup.bind(this));
    document.body.removeEventListener('touchend', this.mouseup.bind(this));
  }

  /**
   * 鼠标移入
   */
  private mouseenter() {
    if (this.isSuccess) {
      return;
    }
    this.setState({
      isMouseEnter: true,
    });
  }

  /**
   * 鼠标离开
   */
  private mouseleave() {
    if (this.isSuccess || this.isMousedown) {
      return;
    }
    this.setState({
      isMouseEnter: false,
    });
  }

  /**
   * 鼠标按下
   */
  private mousedown(e: any) {
    if (this.isSuccess || this.isMousedown) {
      return;
    }
    this.x1 = e.nativeEvent.x || e.touches[0].clientX;
    this.isMousedown = true;
  }

  /**
   * 鼠标移动
   */
  private mousemove(e: any) {
    if (!this.isMousedown || this.isSuccess) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    this.x2 = e.x || e.touches[0].clientX;
    let diff = this.x2 - this.x1;
    if (diff < 0) {
      diff = 0;
    }
    if (diff >= this.max) {
      diff = this.max;
      this.isSuccess = true;
      this.props.verify && this.props.verify();
    }
    this.setState({
      diff,
    });
  }

  /**
   * 鼠标松开
   */
  private mouseup() {
    if (this.isSuccess) {
      return;
    }
    this.isMousedown = false;
    this.setState({
      isMouseEnter: false,
      diff: 0,
    });
  }

  public render() {
    /** 滑条样式 */

    const slideStyle = {
      borderRadius: `${this.state.slideWidth / 2}px`,
      width: `${this.state.diff + this.state.slideWidth}px`,
      // maxWidth: `${this.props.width - 6}px`,
      opacity: 1,
      transitionDuration: !this.state.isMouseEnter || !this.isMousedown ? '.3s' : '0s',
    };
    /** 滑块样式 */
    const barStyle = {
      transitionDuration: !this.state.isMouseEnter || !this.isMousedown ? '.1s' : '0s',
      transform: `translateX(${this.state.diff + 3}px)`,
    };
    return (
      <div style={this.style} className="simple-verify">
        <div className="verify-tips">
          <span>{this.props.tips}</span>
          <SvgImg size={16} type={SvgIconEnum.FCR_MOBILE_ARROW_RIGHT} />
        </div>
        <div className="verify-box">
          <div style={slideStyle} className="veriry-slide" />
        </div>
        <div
          className="verify-bar"
          onMouseEnter={this.mouseenter.bind(this)}
          onTouchStart={this.mouseenter.bind(this)}
          onMouseLeave={this.mouseleave.bind(this)}
          onTouchEnd={this.mouseleave.bind(this)}
          onMouseDown={this.mousedown.bind(this)}
          onTouchMove={this.mousedown.bind(this)}>
          <div style={barStyle} className="icon">
            <SvgImg type={SvgIconEnum.FCR_CLEANWHITEBOARD} size={24} />
          </div>
        </div>
      </div>
    );
  }
}

export const CleanModal = observer(({ onToggle }: any) => {
  const { clean } = useContext(ToolbarUIContext);
  const transI18n = useI18n();

  return (
    <>
      <CleanSimpleVerify
        tips={transI18n('fcr_board_slide_clean')}
        verify={() => {
          clean();
          onToggle(true);
        }}
      />
      <div className="fcr-mobile-slide__close" onClick={() => onToggle(false)}>
        <SvgImg type={SvgIconEnum.FCR_MOBILE_CLOSE} colors={{ iconPrimary: 'var(--ui-01, #F5F5F5)' }} size={16} />
      </div>
    </>
  );
});
