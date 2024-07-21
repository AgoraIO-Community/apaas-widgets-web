import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { FcrRTTWidget } from '.';
import loadingPng from './loading.png';
import './app.css';
import { Avatar } from '@components/avatar';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import classnames from 'classnames';
import { Popover, PopoverWithTooltip } from '@components/popover';
import { RttSettings } from './settings';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { Scheduler } from 'agora-rte-sdk';
import { transI18n } from 'agora-common-libs';
import ReactDOM from 'react-dom';
import { fcrRttManager } from '../../../common/rtt/rtt-manager';
import { FcrRttItem } from '../../../common/rtt/rtt-item';

export type WebviewInterface = {
  refresh: () => void;
};

export const RttComponet = forwardRef<WebviewInterface, { widget: FcrRTTWidget }>(function W(
  { widget }: { widget: FcrRTTWidget },
) {
  const [mouseHover, setMouseHover] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10分钟倒计时，单位为秒
  const [countdownDef, setCountdownDef] = useState(600); // 10分钟倒计时，单位为秒
  const rttContainerRef = useRef<HTMLDivElement>(null);
  const [rttList, setRttList] = useState<FcrRttItem[]>([]);
  const [starting, setStarting] = useState(false);
  const [listening, setListening] = useState(false);
  const [noOnespeakig, setNoOnespeakig] = useState(false);
  const [target, setTarget] = useState('');
  const [showTranslate, setShowTranslate] = useState(false);
  const [visible, setVisible] = useState(false);
  const [rttVisible, setRttVisible] = useState(true);
  const [isRunoutTime, setIsRunoutTime] = useState(true);
  const visibleTaskRef = useRef<Scheduler.Task | null>(null);
  const scrollToBottom = () => {
    if (rttContainerRef.current) {
      rttContainerRef.current.scrollTop = rttContainerRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [rttList]);
  //倒计时计时器
  let countDownTimer: NodeJS.Timeout | null = null;
  const startTimer = (message: { reduce: number, sum: number }) => {
    setCountdownDef(message.sum)
    if (countDownTimer != null) {
      clearInterval(countDownTimer)
    }
    setCountdown(message.reduce)
    setIsRunoutTime(true)
    if (message.reduce > 0) {
      countDownTimer = setInterval(() => {
        setCountdown((prevCountdown) => {
          setIsRunoutTime(false)
          if (prevCountdown <= 0) {
            setIsRunoutTime(true)
            if (countDownTimer) {
              clearInterval(countDownTimer);
            }
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000)
    }
  }
  //所有的监听处理
  useEffect(() => {
    //倒计时修改监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttReduceTimeChange,
      onMessage(message: { reduce: number, sum: number }) {
        startTimer(message)
      },
    })
    //默认启动下倒计时，用来初始化相关变量
    startTimer({ reduce: fcrRttManager.getConfigInfo().experienceReduceTime, sum: fcrRttManager.getConfigInfo().experienceDefTime })
    //字幕显示监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttShowSubtitle,
      onMessage() {
        setVisible(true)
      },
    })
    //字幕隐藏监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttHideSubtitle,
      onMessage() {
        setVisible(false)
      },
    })
    //字幕开启中监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttStateToOpening,
      onMessage() {
        setStarting(true)
      },
    })
    //字幕正在聆听监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttStateToListener,
      onMessage() {
        setStarting(false)
        setListening(true)
        setNoOnespeakig(false)
      },
    })
    //字幕开启成功
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttSubtitleOpenSuccess,
      onMessage() {
        setStarting(false)
        setListening(false)
        setNoOnespeakig(true)
      },
    })
    //字幕无人讲话监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttStateToNoSpeack,
      onMessage() {
        setStarting(false)
        setListening(false)
        setNoOnespeakig(true)
      },
    })
    //字幕关闭
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttCloseSubtitle,
      onMessage() {
        widget.clsoe()
        setVisible(false)
      },
    })
    //字幕内容改变
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttContentChange,
      onMessage() {
        setRttList([...fcrRttManager.getRttList()]);
        setShowTranslate(fcrRttManager.getConfigInfo().openTranscribe);
        setTarget(fcrRttManager.getConfigInfo().getTargetLan().value);
        setRttVisible(true)
        setVisible(true)
        setStarting(false)
        setListening(false)
        setNoOnespeakig(false)
      },
    })
    //设置弹窗显示处理
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttShowSetting,
      onMessage(message:{targetClsName:string,buttonView:Element}) {
        const element = document.getElementsByClassName(message.targetClsName)
        if (element) {
          ReactDOM.render(<SettingPopView buttonView={message.buttonView} />, element[0])
        }
      },
    })
    //字幕按钮点击监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttboxChanged,
      onMessage: (data: { visible: boolean }) => {
        if (data.visible) {
          fcrRttManager.showSubtitle()
        } else {
          fcrRttManager.closeSubtitle()
        }
      },
    });

    //工具箱按钮点击监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ToolboxChanged,
      onMessage: () => {
        const portalTargetList = document.getElementsByClassName('fcr-toolbox-popover-item-dropbox')
        const portalTargetElement1 = portalTargetList[portalTargetList.length - 1];
        const portalTargetElement2 = portalTargetList[portalTargetList.length - 2];
        if (portalTargetElement1) {
          ReactDOM.render(<SetttingPopo />, portalTargetElement1)
        }
        if (portalTargetElement2) {
          ReactDOM.render(<SetttingPopo />, portalTargetElement2)
        }
      },
    });
  }, [])


  useEffect(() => {
    if (!visible) return
    visibleTaskRef.current?.stop();
    if (!starting && !popoverVisible) {
      visibleTaskRef.current = Scheduler.shared.addDelayTask(() => {
        setVisible(false);
        widget.setVisible(true)
      }, 5000);
    }
  }, [starting, rttList, popoverVisible, visible]);
  useEffect(() => {
    widget.setVisible(true)
  }, [rttVisible, rttList, starting, visible]);

  
  interface SettingPopupProps {
    buttonView: Element;
  }
  const SettingPopView:React.FC<SettingPopupProps> = ({buttonView}) => {
      // 查看实时转写
      const viewRtt = () => {
        setVisible(true)
        setPopoverVisible(false)
        fcrRttManager.showConversion()
      }
      return (
        // 
        <Popover
          onVisibleChange={setPopoverVisible}
          content={
            <RttSettings
              widget={widget}
              showTranslate={showTranslate}
              onShowTranslateChanged={(show: boolean | ((prevState: boolean) => boolean)) => {
                // broadcastOptions({ showTranslate: show, target });
                setShowTranslate(show);
              }}
              // source={source}
              target={target}
              onSourceChanged={() => { }}
              viewRtt={viewRtt}
              onTargetChanged={(target) => {
                console.log("target", target)
                broadcastOptions({ showTranslate, target });
                setTarget(target);
                setPopoverVisible(false)
                // setVisible(false)
  
              }}></RttSettings>
          }
          trigger="click">
            {buttonView}
        </Popover>
      );
  }

  const SetttingPopo: React.FC = () => {
    // 查看实时转写
    const viewRtt = () => {
      setVisible(true)
      setPopoverVisible(false)
      fcrRttManager.showConversion()
    }
    return (
      // 
      <Popover
        onVisibleChange={setPopoverVisible}
        content={
          <RttSettings
            widget={widget}
            showTranslate={showTranslate}
            onShowTranslateChanged={(show: boolean | ((prevState: boolean) => boolean)) => {
              // broadcastOptions({ showTranslate: show, target });
              setShowTranslate(show);
            }}
            // source={source}
            target={target}
            onSourceChanged={() => { }}
            viewRtt={viewRtt}
            onTargetChanged={(target) => {
              console.log("target", target)
              broadcastOptions({ showTranslate, target });
              setTarget(target);
              setPopoverVisible(false)
              // setVisible(false)

            }}></RttSettings>
        }
        trigger="click">
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="fcr-rtt-box">
          <SvgImg type={SvgIconEnum.FCR_DROPUP4}></SvgImg>
        </div>
      </Popover>
    );
  };

  const broadcastOptions = ({
    target,
    showTranslate,
  }: {
    target: string;
    showTranslate: boolean;
  }) => {
    widget.broadcast(AgoraExtensionWidgetEvent.RttOptionsChanged, {
      showTranslate,
      target,
    });
  };

  const enableTranslate = !!target;
  const showTranslateOnly = enableTranslate && !showTranslate;
  const lastItem = showTranslateOnly ? rttList.findLast((item) => {
    return !!item.trans?.find((item) => {
      return item.culture === target;
    });
  }) : rttList[rttList.length - 1];
  const lastItemName = widget.classroomStore.streamStore.streamByStreamUuid.get(String(lastItem?.uid),)?.fromUser.userName;
  const active = mouseHover || popoverVisible;
  const sourceText = lastItem?.text;
  const translateText = lastItem?.trans?.find((item) => {
    return item.culture === target;
  })?.text;
  const translating = !translateText && showTranslateOnly;
  const lastItemAvalible = lastItem && lastItemName;

  // 将秒数格式化为分钟和秒钟
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
  // 查看实时转写
  return (
    <div
      style={{ display: visible ? 'block' : 'none' }}
      className={classnames('fcr-rtt-widget-container', 'fcr-bg-black-a80', {
        'fcr-bg-2-a50': !active,
        'fcr-border-transparent': !active,
        'fcr-border-brand': active,
      })}
      onMouseEnter={() => setMouseHover(true)}
      onMouseLeave={() => setMouseHover(false)}
      ref={rttContainerRef}>
      <div className="fcr-rtt-widget-actions">
        <PopoverWithTooltip
          popoverProps={{
            onVisibleChange: setPopoverVisible,
            content: (
              <RttSettings
                showTranslate={showTranslate}
                onShowTranslateChanged={(show) => {
                  // broadcastOptions({ showTranslate: show, target });
                  setShowTranslate(show);
                }}
                // source={source}
                target={target}
                viewRtt={() => {

                }}
                onSourceChanged={() => { }}
                onTargetChanged={(target) => {
                  console.log("target", target)
                  // broadcastOptions({ showTranslate, target });
                  setTarget(target);
                }}></RttSettings>
            ),
            placement: 'top',
            overlayInnerStyle: { width: 175 },
          }}
          toolTipProps={{ content: transI18n('fcr_subtitles_button_subtitles_setting') }}>
          <div className="fcr-rtt-widget-action">
            <SvgImg type={SvgIconEnum.FCR_TRANSLATE} size={24}></SvgImg>
          </div>

        </PopoverWithTooltip>
        <ToolTip content={transI18n('fcr_subtitles_button_subtitles_close')}>
          <div onClick={() => fcrRttManager.closeSubtitle()} className="fcr-rtt-widget-action fcr-rtt-widget-close">
            <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16}></SvgImg>
          </div>
        </ToolTip>
      </div>
      {isRunoutTime && <div className="fcr-limited-box">
        <div className="fcr-limited-box-title">{transI18n('fcr_limited_time_experience')}</div>
        {transI18n('fcr_dialog_rtt_subtitles_dialog_time_limit_end', {
          reason1: countdownDef / 60,
        })}
      </div>}
      {!isRunoutTime &&
        <div className="fcr-limited-box">
          <div className="fcr-limited-box-title">{transI18n('fcr_limited_time_experience')}</div>
          {transI18n('fcr_dialog_rtt_subtitles_dialog_time_limit_reduce', {
            reason1: countdownDef / 60,
            reason2: formatTime(countdown),
          })}
        </div>}
      {/* 开启中 */}
      {starting && !isRunoutTime && (
        <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center">
          <img src={loadingPng} style={{ width: '20px', height: '20px', marginRight: '10px', verticalAlign: 'middle', animation: 'rotate 1s linear infinite', }}></img>
          {transI18n('fcr_subtitles_text_turn_on')} ...
        </div>
      )}
      {isRunoutTime && (
        <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center">
          {transI18n('fcr_dialog_rtt_time_limit_status_empty')}
        </div>
      )}
      {/* 正在聆听 */}
      {listening && !starting && !noOnespeakig && !isRunoutTime && (
        <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center">
          <SvgImg type={SvgIconEnum.FCR_V2_HEAR} size={16} style={{ verticalAlign: 'middle', marginRight: '10px', marginBottom: '4px' }}></SvgImg>
          {transI18n('fcr_subtitles_text_listening')} ...
        </div>
      )}
      {/* 没有人正在说话 */}
      {noOnespeakig && !starting && !translating && !isRunoutTime && (
        <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center">
          {transI18n('fcr_subtitles_text_no_one_speaking')}
        </div>
      )}

      {lastItemAvalible && !listening && !starting && !noOnespeakig && !isRunoutTime && (
        <div className="fcr-rtt-widget-text">
          <Avatar textSize={14} size={30} nickName={lastItemName}></Avatar>
          <div>
            <div className="fcr-rtt-widget-name">{lastItemName}:</div>
            <div className="fcr-rtt-widget-transcribe" style={{ fontSize: localStorage.getItem("subtitleFontSize") + "px" }}>
              {enableTranslate && !showTranslate ? translateText : sourceText}
            </div>
            {enableTranslate && showTranslate && (
              <div className="fcr-rtt-widget-translate" style={{ fontSize: localStorage.getItem("subtitleFontSize") + "px" }}>{translateText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export const App = observer(({ widget }: { widget: FcrRTTWidget }) => {
  return <RttComponet widget={widget} />;
});
