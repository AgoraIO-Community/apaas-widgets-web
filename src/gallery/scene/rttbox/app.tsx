import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { FcrRttboxWidget } from '.';
import axios from 'axios';
import protoRoot from './proto';
import { v4 as uuidV4 } from 'uuid';
import './app.css';
import { Avatar } from '@components/avatar';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import classnames from 'classnames';
import { PopoverWithTooltip } from '@components/popover';
import { RttSettings } from './settings';
import { SearchInput } from './searchinput';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { AGRemoteVideoStreamType, Scheduler } from 'agora-rte-sdk';
import { transI18n } from 'agora-common-libs';
import { Input } from '@components/input';
import { notification } from 'antd';
import 'antd/dist/antd.css';
import { Button } from '@components/button';
import { center } from '@antv/g2plot/lib/plots/sankey/sankey';
import { ToastApi } from '@components/toast';
import { fcrRttManager } from '../../../common/rtt/rtt-manager';
import { AgoraEduClassroomEvent } from 'agora-edu-core';
import { FcrRttItem } from '../../../common/rtt/rtt-item';



export type WebviewInterface = {
  refresh: () => void;
};

const rttSubscribeUser = '999999';
const rttPublishUser = '888888';

interface RttItem {
  uuid: string;
  culture: string;
  uid: string;
  text: string;
  trans?: {
    culture: string;
    text: string;
  }[];
  time: number;
  isFinal: boolean;
  confidence: number;
}

export const RttBoxComponet = forwardRef<WebviewInterface, { widget: FcrRttboxWidget }>(function W(
  { widget }: { widget: FcrRttboxWidget },
  ref,
) {
  const [mouseHover, setMouseHover] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsCount, setSearchResultsCount] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const rttContainerRef = useRef<HTMLDivElement>(null);
  const rttParamsRef = useRef({
    appId: '',
    taskId: '',
    rttToken: '',
  });
  const [rttList, setRttList] = useState<RttItem[]>([]);
  const [starting, setStarting] = useState(false);
  const [source, setSource] = useState('zh-CN,en-US');
  const [target, setTarget] = useState('');
  const [showTranslate, setShowTranslate] = useState(false);
  const [visible, setVisible] = useState(true);
  const [searchKey, setsearchKey] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleTaskRef = useRef<Scheduler.Task | null>(null);
  const rttListRef = useRef(rttList);
  const configInfo = fcrRttManager.getConfigInfo();
  const [isOpenrtt, setIsOpenrtt] = useState(configInfo.openTranscribe);
  const [isRunoutTime, setIsRunoutTime] = useState(true);
  const [countdown, setCountdown] = useState(600); // 10分钟倒计时，单位为秒
  const [countdownDef, setCountdownDef] = useState(600); // 10分钟倒计时，单位为秒
  const [api, contextHolder] = notification.useNotification();
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
    setVisible(true);
    visibleTaskRef.current?.stop();
  }, [starting, rttList, popoverVisible]);


  useEffect(() => {
    console.log(configInfo.openTranscribe)
    //转写列表改变
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttListChange,
      onMessage() {
        setRttList([...fcrRttManager.getRttList()]);
        setShowTranslate(fcrRttManager.getConfigInfo().openTranscribe);
        setTarget(fcrRttManager.getConfigInfo().getTargetLan().value);
        scrollToBottom()
      },
    })
    // 转写状态改变
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ReceiveTranscribeOpen,
      onMessage(data) {
        openNotification(data)
      },
    })
  }, []);

  useEffect(() => {
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttOptionsChanged,
      onMessage: handleRttOptionsChanged,
    });
    // widget.addBroadcastListener({
    //   messageType: AgoraExtensionRoomEvent.ChangeRttlanguage,
    //   onMessage: (data) => {
    //     console.log("接收到的数据", data)
    //     setTimeout(() => {
    //       ToastApi.open({
    //         toastProps: {
    //           type: 'normal',
    //           content: "老师(我) 开启了实时转写服务，全体用户可见。",
    //         },
    //       });
    //     }, 100);
    //     // rttList.push({text:"老师(我) 已停止实时转写"})
    //   }
    // });

    widget.broadcast(AgoraExtensionWidgetEvent.RequestRttOptions, 'fcr_rtt_settings_show');
  }, []);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    const count = rttListRef.current.filter(item => item.text.includes(query)).length;
    setSearchResultsCount(count);
  };

  const enableTranslate = !!target;
  const showTranslateOnly = enableTranslate && !showTranslate;
  const filteredRttList = rttList.filter(item => item.text.includes(searchQuery) || (item.trans && item.trans.some(transItem => transItem.text.includes(searchQuery))));
 
  useEffect(() => {
    if (filteredRttList.length > 0 && currentIndex == 0) {
      setCurrentIndex(1)
    }
    if (searchQuery == '') {
      setTotalResults(0);
      setCurrentIndex(0)
      return false
    }
    const a = countMatches(filteredRttList, searchQuery)
    setTotalResults(a);
  }, [filteredRttList]);
  const countMatches = (list: any, query: string) => {
    return list.reduce((count: number, item: any) => {
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
  // const result = text.replace(`/${searchQuery}/g`, (match) => {
  //     return `<span style="background-color: '#4262FF'">${newText}</span>`;
  // });


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

  // text.replaceAll(searchQuery,`<span style="background-color: '#4262FF'">${searchQuery}</span>`)
  // const highlightedText = text.replace(`/${searchQuery}/g`, (match) => {
  //   return `<span style="background-color: '#4262FF'">${searchQuery}</span>`;
  // });
  // return  text.replaceAll(searchQuery,"<span style="background-color: '#4262FF'"> + v"</span>)
  ;
  // return text.replaceAll
  // return text.split(regex).map((part, index) => {
  //   if (regex.test(part)) {
  //     return <span key={index} style={highlightStyle}>{part}</span>;
  //   }
  //   return part;
  // });
  // };
  const lastItem = showTranslateOnly
    ? rttList.findLast((item) => {
      return !!item.trans?.find((item) => {
        return item.culture === target;
      });
    })
    : rttList[rttList.length - 1];
  const lastItemName = widget.classroomStore.streamStore.streamByStreamUuid.get(
    String(lastItem?.uid),
  )?.fromUser.userName;

  const active = mouseHover || popoverVisible;
  const sourceText = lastItem?.text;
  const translateText = lastItem?.trans?.find((item) => {
    return item.culture === target;
  })?.text;
  const translating = !translateText && showTranslateOnly;
  const lastItemAvalible = lastItem && lastItemName;
  const handleArrowClick = (direction: string) => {
    if (direction === 'up' && currentIndex > 1) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'down' && currentIndex < totalResults) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  const highlightText = (text: string, charToHighlight: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | null | undefined) => {
    if (!text) return text;
    const parts = text.split(charToHighlight);
    return parts.reduce((acc: any, part: any, index: React.Key | null | undefined) => {
      if (index === parts.length - 1) {
        return [...acc, part];
      }
      return [...acc, part, <span className="highlight" key={index}>{charToHighlight}</span>];
    }, []);
  };
  return (
    // <div
    //   style={{ display: visible ? 'block' : 'none', resize: 'both', overflow: 'auto', minWidth: '320px', maxWidth: '600px', minHeight: '400px', maxHeight: '800px' }}
    //   className={classnames('fcr-rtt-box-widget-container')}
    //   onMouseEnter={() => setMouseHover(true)}
    //   onMouseLeave={() => setMouseHover(false)}
    //   ref={rttContainerRef}>
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

          {/* <SvgImg type={SvgIconEnum.FCR_V2_SEARCH} size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={transI18n('fcr_rtt_search_placeholder')}
              />
              <span>{searchResultsCount}</span> */}
          {/* </div> */}
          {/* </div> */}
          {!isRunoutTime && <div className="rtt-list" style={{ paddingBottom: '30px' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="open-language">开启翻译识别内容</div>
            </div>

            {filteredRttList.map((item, index) => (
              <div>
                {item.uuid && <div key={item.uuid} className="fcr-rtt-widget-text" style={{ backgroundColor: 'rgba(0,0,0,0)' }}>
                <Avatar textSize={14} size={30} nickName={widget.classroomStore.streamStore.streamByStreamUuid.get(String(item.uid))?.fromUser.userName}></Avatar>
                <div>
                  <div className="fcr-rtt-widget-name" style={{ fontSize: '12PX' }}>{widget.classroomStore.streamStore.streamByStreamUuid.get(String(item.uid))?.fromUser.userName}:</div>
                  <div className="fcr-rtt-widget-transcribe">

                    {/* <rich-text nodes="<div>这里是富文本内容</div>"></rich-text> */}
                    {enableTranslate && !showTranslate ? item.trans?.find(transItem => transItem.culture === target)?.text : renderHighlightedText(item.text, index)}
                  </div>
                  {enableTranslate && showTranslate && (
                    <div className="fcr-rtt-widget-translate">{item.trans?.find(transItem => transItem.culture === target)?.text}</div>
                  )}
                </div>
              </div>}
              {!item.uuid && 
               <div style={{ textAlign: 'center' }}>
               <div className="open-language"></div>
             </div>
              }
              
              </div>
              
            ))}

          </div>}
          {active && (
            <div className="fcr-rtt-widget-actions">
              <PopoverWithTooltip
                popoverProps={{
                  onVisibleChange: setPopoverVisible,

                  content: (
                    <RttSettings
                      showTranslate={showTranslate}
                      onShowTranslateChanged={(show) => {
                        broadcastOptions({ showTranslate: show, target });
                        setShowTranslate(show);
                      }}
                      source={source}
                      target={target}
                      onSourceChanged={() => { }}
                      onTargetChanged={(target) => {
                        broadcastOptions({ showTranslate, target });
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
                <div onClick={widget.clsoe} className="fcr-rtt-widget-action fcr-rtt-widget-close">
                  <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16}></SvgImg>
                </div>
              </ToolTip>
            </div>
          )}

          {/* {lastItemAvalible && !translating && !starting && (
            <div className="fcr-rtt-widget-text">
              <Avatar textSize={14} size={30} nickName={lastItemName}></Avatar>
              <div>
                <div className="fcr-rtt-widget-name">{lastItemName}:</div>
                <div className="fcr-rtt-widget-transcribe">
                  {enableTranslate && !showTranslate ? translateText : sourceText}
                </div>
                {enableTranslate && showTranslate && (
                  <div className="fcr-rtt-widget-translate">{translateText}</div>
                )}
              </div>
            </div>
          )} */}
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
