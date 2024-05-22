import React from 'react';
import { SvgIconEnum, SvgImg } from '../../../../../../../fcr-ui-kit/src/components/svg-img';
import './slide.css';

interface CleanSimpleVerifyProps {
  width: number;
  borderRadius: number;
  tips: string;
  verify?: () => void;
}

interface CleanSimpleVerifyState {
  isMouseEnter: boolean;
  diff: number;
}
export default class CleanSimpleVerify extends React.Component<
  CleanSimpleVerifyProps,
  CleanSimpleVerifyState
> {
  static defaultProps = {
    width: 180,
    borderRadius: 21,
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

  constructor(props: ReactSimpleVerifyProps) {
    super(props);
    this.state = {
      /** 是否滑入 */
      isMouseEnter: false,
      /** 滑动距离 */
      diff: 0,
    };
  }

  /**
   * 绑定事件
   */
  public componentDidMount() {
    document.body.addEventListener('mousemove', this.mousemove.bind(this));
    document.body.addEventListener('touchmove', this.mousemove.bind(this));
    document.body.addEventListener('mouseup', this.mouseup.bind(this));
    document.body.addEventListener('touchend', this.mouseup.bind(this));
  }

  /**
   * 移除事件
   */
  public componentWillUnmount() {
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
      borderRadius: this.props.borderRadius,
      width: `${this.state.diff + 42 - 6}px`,
      // opacity: this.state.isMouseEnter ? 1 : 0,
      opacity: 1,
      transitionDuration: !this.state.isMouseEnter || !this.isMousedown ? '.3s' : '0s',
    };
    /** 滑块样式 */
    const barStyle = {
      transitionDuration: !this.state.isMouseEnter || !this.isMousedown ? '.15s' : '0s',
      transform: `translateX(${this.state.diff + 3}px)`,
    };
    return (
      <div style={this.style} className="simple-verify">
        <div className="verify-tips">{this.props.tips}</div>
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
