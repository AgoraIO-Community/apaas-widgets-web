import React, { forwardRef, ReactNode, useEffect, useRef, useState } from 'react';
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
import { AgoraExtensionRoomEvent } from '../../../events';
import { transI18n } from 'agora-common-libs';
import ReactDOM from 'react-dom';
import { fcrRttManager } from '../../../common/rtt/rtt-manager';
import { FcrRttItem } from '../../../common/rtt/rtt-item';
import { ToastApi } from '@components/toast';

export type WebviewInterface = {
  refresh: () => void;
};

export const RttComponet = forwardRef<WebviewInterface, { widget: FcrRTTWidget }>(function W(
  { widget }: { widget: FcrRTTWidget },
) {
  const [mouseHover, setMouseHover] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [countdown, setCountdown] = useState(""); // 10分钟倒计时，单位为秒
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
  const scrollToBottom = () => {
    if (rttContainerRef.current) {
      rttContainerRef.current.scrollTop = rttContainerRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [rttList]);
  //所有的监听处理
  useEffect(() => {
    //倒计时修改监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttReduceTimeChange,
      onMessage(message: { reduce: number, sum: number,reduceTimeStr:string }) {
        setCountdownDef(message.sum)
        setCountdown(message.reduceTimeStr)
        setIsRunoutTime(message.reduce <= 0)
      },
    })
    //默认启动下倒计时，用来初始化相关变量
    setCountdownDef(fcrRttManager.getConfigInfo().experienceDefTime)
    setCountdown(fcrRttManager.getConfigInfo().formatReduceTime())
    setIsRunoutTime(fcrRttManager.getConfigInfo().experienceReduceTime <= 0)
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
        ToastApi.open({
          toastProps: {
              type: 'normal',
              content: transI18n('fcr_already_close_subtitles'),
          },
      });
        
      },
    })
    //字幕内容改变
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttContentChange,
      onMessage() {
        setRttList([...fcrRttManager.getRttList()]);
        setShowTranslate(fcrRttManager.getConfigInfo().isOpenTranscribe());
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
      onMessage(message: { targetClsName: string, buttonView: ReactNode, showToConversionSetting: boolean, showToSubtitleSetting: boolean }) {
        const element = document.getElementsByClassName(message.targetClsName)
        if (element) {
          ReactDOM.render(<SettingPopView buttonView={message.buttonView} showToConversionSetting={message.showToConversionSetting} showToSubtitleSetting={message.showToSubtitleSetting} />, element[0])
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
    //实时转写按钮点击监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttBoxshow,
      onMessage: () => {
        const rttSettingBtn: HTMLElement | null = document.getElementById('fcr-rtt-settings-button')
        fcrRttManager.showConversion()
        setTimeout(() => {
          if (rttSettingBtn) {
            const view = <div onClick={(e) => { e.stopPropagation(); }} className="fcr-rtt-box"><SvgImg type={SvgIconEnum.FCR_DROPUP4}></SvgImg></div>
            ReactDOM.render(<SettingPopView buttonView={view} showToConversionSetting={false} showToSubtitleSetting={true} />, rttSettingBtn)
          }
        }, 3000)
      },
    });
    //工具箱按钮点击监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ToolboxChanged,
      onMessage: () => {
        const portalTargetList = document.getElementsByClassName('fcr-toolbox-popover-item-dropbox')
        const portalTargetElement1 = portalTargetList[portalTargetList.length - 1];
        const portalTargetElement2 = portalTargetList[portalTargetList.length - 2];
        const view = <div onClick={(e) => { e.stopPropagation(); }} className="fcr-rtt-box"><SvgImg type={SvgIconEnum.FCR_DROPUP4}></SvgImg></div>
        if (portalTargetElement1) {
          ReactDOM.render(<SettingPopView buttonView={view} showToConversionSetting={true} showToSubtitleSetting={false} />, portalTargetElement1)
        }
        if (portalTargetElement2) {
          ReactDOM.render(<SettingPopView buttonView={view} showToConversionSetting={false} showToSubtitleSetting={true} />, portalTargetElement2)
        }
      },
    });
  }, [])

  useEffect(() => {
    widget.setVisible(true)
  }, [rttVisible, rttList, starting, visible]);

  //设置视图配置信息
  interface SettingViewProps {
    buttonView: ReactNode | null;
    showToConversionSetting: boolean;
    showToSubtitleSetting: boolean;
  }
  //设置视图
  const SettingView: React.FC<SettingViewProps> = ({ showToConversionSetting, showToSubtitleSetting }) => {
    return <RttSettings widget={widget} showToConversionSetting={showToConversionSetting} showToSubtitleSetting={showToSubtitleSetting}></RttSettings>
  }
  //动态添加触发按钮的视图
  const SettingPopView: React.FC<SettingViewProps> = ({ buttonView, showToConversionSetting, showToSubtitleSetting }) => {
    return (
      <Popover
        onVisibleChange={setPopoverVisible}
        content={<SettingView buttonView={null} showToConversionSetting={showToConversionSetting} showToSubtitleSetting={showToSubtitleSetting}></SettingView>}
        trigger="click">
        {buttonView}
      </Popover>
    );
  }

  const enableTranslate = !!target;
  const showTranslateOnly = enableTranslate && !showTranslate;
  const lastItem = showTranslateOnly ? rttList.findLast((item) => {
    return !!item.trans?.find((item) => {
      return item.culture === target;
    });
  }) : rttList[rttList.length - 1];
  const lastItemName = widget.classroomStore.streamStore.streamByStreamUuid.get(String(lastItem?.uid),)?.fromUser.userName;
  const active = mouseHover || popoverVisible;
  //声源语言
  const sourceText = lastItem?.text;
  //翻译语言
  const translateText = lastItem?.trans?.find((item) => {
    return item.culture === target;
  })?.text;
  const configInfo = fcrRttManager.getConfigInfo();
  //语言显示
  const leve2Text = configInfo.isShowDoubleLan() && configInfo.getTargetLan() && configInfo.getTargetLan().value !== configInfo.getSourceLan().value ? translateText : null;
  const leve1Text = !configInfo.isShowDoubleLan() && leve2Text !== null && leve2Text !== undefined ? leve2Text : sourceText
  

  const translating = !translateText && showTranslateOnly;
  const lastItemAvalible = lastItem && lastItemName;
  return (
    <div style={{ display: visible ? 'block' : 'none', paddingBottom: '14px' }}
      ref={rttContainerRef}>
      <div>
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
              reason2: countdown,
            })}
          </div>}
      </div>
      <div className={classnames('fcr-rtt-subtitle-content', 'fcr-bg-black-a80', {
        'fcr-bg-2-a50': !active,
        'fcr-border-transparent': !active,
        'fcr-border-brand': active,
      })}
        onMouseEnter={() => setMouseHover(true)}
        onMouseLeave={() => setMouseHover(false)}>
        <div className="fcr-rtt-widget-actions">
          <ToolTip content={transI18n('fcr_subtitles_button_subtitles_setting')}>
            <PopoverWithTooltip
              popoverProps={{
                onVisibleChange: setPopoverVisible,
                content: (<SettingView buttonView={undefined} showToConversionSetting={true} showToSubtitleSetting={false} ></SettingView>),
                placement: 'top',
                overlayInnerStyle: { width: 175 },
              }}
              toolTipProps={{ content: transI18n('fcr_subtitles_button_subtitles_setting') }}>
              <div className="fcr-rtt-widget-action">
                <SvgImg type={SvgIconEnum.FCR_TRANSLATE} size={24}></SvgImg>
              </div>
            </PopoverWithTooltip>
          </ToolTip>
          <ToolTip content={transI18n('fcr_subtitles_button_subtitles_close')}>
            <div onClick={() => fcrRttManager.closeSubtitle()} className="fcr-rtt-widget-action fcr-rtt-widget-close">
              <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16}></SvgImg>
            </div>
          </ToolTip>
        </div>
        <div>
          {/* 开启中 */}
          {starting && !isRunoutTime && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
              <img src={loadingPng} style={{ width: '20px', height: '20px', marginRight: '10px', verticalAlign: 'middle', animation: 'rotate 1s linear infinite', }}></img>
              {transI18n('fcr_subtitles_text_turn_on')} ...
            </div>
          )}
          {isRunoutTime && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
              {transI18n('fcr_dialog_rtt_time_limit_status_empty')}
            </div>
          )}
          {/* 正在聆听 */}
          {listening && !starting && !noOnespeakig && !isRunoutTime && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
              <SvgImg type={SvgIconEnum.FCR_V2_HEAR} size={16} style={{ verticalAlign: 'middle', marginRight: '10px', marginBottom: '4px' }}></SvgImg>
              {transI18n('fcr_subtitles_text_listening')} ...
            </div>
          )}
          {/* 没有人正在说话 */}
          {noOnespeakig && !starting && !translating && !isRunoutTime && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
              {transI18n('fcr_subtitles_text_no_one_speaking')}
            </div>
          )}
        </div>

        {lastItemAvalible && !listening && !starting && !noOnespeakig && !isRunoutTime && (
          <div className="fcr-rtt-widget-text">
            <Avatar textSize={14} size={30} nickName={lastItemName}></Avatar>
            <div>
              <div className="fcr-rtt-widget-name">{lastItemName}:</div>
              <div className="fcr-rtt-widget-transcribe" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
                {leve1Text}
              </div>
              {(
                <div className="fcr-rtt-widget-translate" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>{leve2Text}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
});

export const App = observer(({ widget }: { widget: FcrRTTWidget }) => {
  return <RttComponet widget={widget} />;
});
