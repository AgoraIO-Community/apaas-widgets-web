import { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { FcrRttboxWidget } from '.';
import './app.css';
import { Avatar } from '@components/avatar';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { transI18n } from 'agora-common-libs';
import { Input } from '@components/input';
import { notification } from 'antd';
import './NotificationStyle.css';
import { fcrRttManager } from '../../../common/rtt/rtt-manager';
import { FcrRttItem } from 'src/common/rtt/rtt-item';



export type WebviewInterface = {
  refresh: () => void;
};

export const RttBoxComponet = forwardRef<WebviewInterface, { widget: FcrRttboxWidget }>(function W(
  { widget }: { widget: FcrRttboxWidget },
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const rttContainerRef = useRef<HTMLDivElement>(null);
  const [rttList, setRttList] = useState<FcrRttItem[]>([]);
  const [target, setTarget] = useState('');
  const [showTranslate, setShowTranslate] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const configInfo = fcrRttManager.getConfigInfo();
  const [isOpenrtt, setIsOpenrtt] = useState(configInfo.isOpenTranscribe());
  const [isRunoutTime, setIsRunoutTime] = useState(true);
  const [countdown, setCountdown] = useState(600); // 10分钟倒计时，单位为秒
  const [countdownDef, setCountdownDef] = useState(600); // 10分钟倒计时，单位为秒
  const scrollToBottom = () => {
    if (rttContainerRef.current) {
      rttContainerRef.current.scrollTop = rttContainerRef.current.scrollHeight;
    }
  };
  const openNotification = (message: string) => {
    const key = `open${Date.now()}`;
    const btn = (
      <div>
        <button style={{ padding: ' 4px 10px 4px 10px', backgroundColor: '#555B69', borderRadius: '10px', color: '#ffffff', marginRight: '10px' }} onClick={() => { notification.destroy() }}>
          {transI18n('fcr_rtt_notification_view')}
        </button>
        <button style={{ padding: ' 4px 10px 4px 10px', backgroundColor: '#4262FF', borderRadius: '10px', color: '#ffffff' }} onClick={() => { notification.destroy() }}>
          {transI18n('fcr_rtt_notification_ignore')}
        </button>
      </div>
    );
    notification.open({
      message: <span style={{ color: '#ffffff', paddingLeft: '20px' }}>{transI18n('fcr_rtt_button_open')}</span>,
      description: <p style={{ color: '#ffffff', paddingLeft: '20px' }}>{message}</p>,
      btn,
      key,
      duration: null,
      placement: 'topLeft',
      top: 46,
      style: {
        background: 'rgba(47, 47, 47, 0.95)',
        color: '#ffffff',
        borderRadius: '10px'
      },
      // SvgIconEnum.FCR_V2_SUBTITIES
      icon: <div style={{ width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#16D1A4', borderRadius: '50%' }}><SvgImg type={SvgIconEnum.FCR_V2_RTT} size={36}></SvgImg></div>,
      onClose: () => console.log('Notification was closed.'),
    });
  };
  //开启所有监听
  useEffect(() => {
    //默认启动下倒计时，用来初始化相关变量
    startTimer({ reduce: fcrRttManager.getConfigInfo().experienceReduceTime, sum: fcrRttManager.getConfigInfo().experienceDefTime })
    //倒计时修改监听
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttReduceTimeChange,
      onMessage(message: { reduce: number, sum: number }) {
        startTimer(message)
      },
    })
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttConversionOpenSuccess,
      onMessage() {
        setIsOpenrtt(true)
        widget.setMinimize(true, { ...widget.minimizedProperties });
      },
    })
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttConversionCloseSuccess,
      onMessage() {
        setIsOpenrtt(false)
      },
    })
  }, []);
  let countDownTimer: NodeJS.Timeout | null = null;
  // 将秒数格式化为分钟和秒钟
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
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

  useEffect(scrollToBottom, [rttList]);

  useEffect(() => {
    //转写列表改变
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttListChange,
      onMessage() {
        setRttList([...fcrRttManager.getRttList()]);
        setShowTranslate(fcrRttManager.getConfigInfo().isOpenTranscribe());
        setTarget(fcrRttManager.getConfigInfo().getTargetLan().value);
        scrollToBottom()
      },
    })
    // 转写状态改变
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ReceiveTranscribeOpen,
      onMessage(data: string) {
        openNotification(data)
      },
    })
  }, []);

  useEffect(() => {
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttOptionsChanged,
      onMessage: handleRttOptionsChanged,
    });
    widget.broadcast(AgoraExtensionWidgetEvent.RequestRttOptions, 'fcr_rtt_settings_show');
  }, []);

  const handleRttOptionsChanged = ({
    target,
    showTranslate,
  }: {
    target: string;
    showTranslate: boolean;
  }) => {
    setShowTranslate(showTranslate);
    setTarget(target);
  };


  const enableTranslate = !!target;
  const filteredRttList = rttList.filter(item => item.text.includes(searchQuery) || (item.trans && item.trans.some(transItem => transItem.text.includes(searchQuery))));
  useEffect(() => {
    if (filteredRttList.length > 0 && currentIndex == 0) {
      setCurrentIndex(1)
    }
    if (searchQuery == '') {
      setTotalResults(0);
      setCurrentIndex(0)
      return
    }
    const a = countMatches(filteredRttList, searchQuery)
    setTotalResults(a);
  }, [filteredRttList]);

  //数量匹配
  const countMatches = (list: FcrRttItem[], query: string) => {
    return list.reduce((count: number, item: FcrRttItem) => {
      let itemCount = 0;
      if (item.text.includes(query)) {
        itemCount += (item.text.match(new RegExp(query, 'gi')) || []).length;
      }
      if (item.trans) {
        item.trans.forEach(transItem => {
          if (transItem.text.includes(query)) {
            itemCount += (transItem.text.match(new RegExp(query, 'gi')) || []).length;
          }
        });
      }

      return count + itemCount;
    }, 0);
  };

  //高亮匹配
  const renderHighlightedText = (text: string, currIndex: number) => {
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === searchQuery.toLowerCase() && part ? (
            <span key={index} className={index + currIndex === currentIndex ? "highlighted-current" : "highlighted"}>{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleArrowClick = (direction: string) => {
    if (direction === 'up' && currentIndex > 1) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'down' && currentIndex < totalResults) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  return (
    <div className="fcr-chatroom-dialog-wrapper">
      <div
        ref={rttContainerRef}
        style={{ width: widget.defaultRect.width, height: widget.defaultRect.height }}
        className="fcr-chatroom-dialog-content">
        <div className="fcr-chatroom-dialog-title">
          <div
            className="fcr-chatroom-dialog-title-close"
            onClick={() => widget.clsoe()}>
            <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16}></SvgImg>
          </div>
          <span className='fcr-chatroom-dialog-title-text' fcr-chatroom-dialog-title>字幕</span>
        </div>
        <div className="fcr-chatroom-dialog-tab-inner">
          {/* <div className="search-container"> */}
          {/* <div className="search-box"> */}
          <div className="fcr-chatroom-member-list-search fcr-rttbox-list-search">
            <Input
              shape="rounded"
              size="medium"
              allowClear={false}
              value={searchQuery}
              onChange={setSearchQuery}
              iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
              placeholder={transI18n('fcr_chat_label_search')}
            />
            <div style={{ display: 'flex', alignItems: 'center', position: 'absolute', right: '10px', top: '9px' }}>
              <div className='fcr-input-icon-clear' onClick={()=>{setSearchQuery("")}}>
                <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16} />
              </div>
              <span style={{ color: '#fff' }}>{`${currentIndex} / ${totalResults}`}</span>
              <div className="fcrr-drop-arrow-button-box">

                <div className="fcr-drop-arrow" onClick={() => handleArrowClick('up')}>
                  <SvgImg colors={{ iconPrimary: currentIndex <= 1 ? 'rgba(255,255,255,0.5)' : '#ffffff' }} style={{ position: 'absolute', top: 0 }} type={SvgIconEnum.FCR_DROPUP4} onClick={() => handleArrowClick('up')}></SvgImg>
                </div>
                <div className="fcr-drop-arrow" onClick={() => handleArrowClick('down')}>
                  <SvgImg colors={{ iconPrimary: currentIndex >= totalResults ? 'rgba(255,255,255,0.5)' : '#ffffff' }} style={{ position: 'absolute', bottom: 0 }} type={SvgIconEnum.FCR_DROPDOWN4}></SvgImg>
                </div>

              </div>
            </div>
          </div>
          {isRunoutTime && <div className="fcr-limited-time-experience">
            <div className="fcr-limited-box-title">{transI18n('fcr_limited_time_experience')}</div>
            {transI18n('fcr_dialog_rtt_subtitles_dialog_time_limit_end', {
              reason1: countdownDef / 60,
            })}
          </div>}
          {!isRunoutTime && <div className="fcr-limited-time-experience">
            <div className="fcr-limited-box-title">{transI18n('fcr_limited_time_experience')}</div>
            {transI18n('fcr_dialog_rtt_subtitles_dialog_time_limit_reduce', {
              reason1: countdownDef / 60,
              reason2: formatTime(countdown),
            })}
          </div>}

          {!isRunoutTime && <div className="rtt-list" style={{ paddingBottom: '30px' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="open-language">开启翻译识别内容</div>
            </div>
            {filteredRttList.map((item, index) => {
              const userInfo = widget.classroomStore.streamStore.streamByStreamUuid.get(String(item.uid));
              return <div key={index}>
                {item.uuid && <div key={item.uuid} className="fcr-rtt-widget-text" style={{ backgroundColor: 'rgba(0,0,0,0)' }}>
                  <Avatar textSize={14} size={30} nickName={userInfo ? userInfo.fromUser.userName : ""}></Avatar>
                  <div>
                    <div className="fcr-rtt-widget-name" style={{ fontSize: '12PX' }}>{widget.classroomStore.streamStore.streamByStreamUuid.get(String(item.uid))?.fromUser.userName}:</div>
                    <div className="fcr-rtt-widget-transcribe">
                      {enableTranslate && !showTranslate ? item.trans?.find(transItem => transItem.culture === target)?.text : renderHighlightedText(item.text, index)}
                    </div>
                    {enableTranslate && showTranslate && (<div className="fcr-rtt-widget-translate">{item.trans?.find(transItem => transItem.culture === target)?.text}</div>)}
                  </div>
                </div>}
                {!item.uuid && <div style={{ textAlign: 'center' }}> <div className="open-language"></div></div>}
              </div>
            })}

          </div>}
          <div className="footer">
            {isOpenrtt && <button className="stop-button" style={{ backgroundColor: 'rgba(0,0,0,0)', border: '1px solid' }} onClick={() => fcrRttManager.closeConversion()}>{transI18n('fcr_rtt_stop_transcription')}</button>}
            {!isOpenrtt && <button className="stop-button" onClick={() => { fcrRttManager.showConversion() }}>{transI18n('fcr_rtt_start_transcription')}</button>}
            <div className='fcr_rtt_settings_show'></div>
          </div>
        </div>
      </div>
    </div>

    // </div>
  );
});

export const App = observer(({ widget }: { widget: FcrRttboxWidget }) => {
  return <RttBoxComponet widget={widget} />;
});