import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { FcrRTTWidget } from '.';
import axios from 'axios';
import protoRoot from './proto';
import loadingPng from './loading.png';
import { v4 as uuidV4 } from 'uuid';
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
import { createPortal } from 'react-dom';
import ReactDOM from 'react-dom';
import { left } from '@antv/g2plot/lib/plots/sankey/sankey';
import { Loading } from '../whiteboard/loading';


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

export const RttComponet = forwardRef<WebviewInterface, { widget: FcrRTTWidget }>(function W(
  { widget }: { widget: FcrRTTWidget },
  ref,
) {
  const [mouseHover, setMouseHover] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [countdown, setCountdown] = useState(600); // 5分钟倒计时，单位为秒

  const rttContainerRef = useRef<HTMLDivElement>(null);
  const rttParamsRef = useRef({
    appId: '',
    taskId: '',
    rttToken: '',
  });
  const [rttList, setRttList] = useState<RttItem[]>([]);
  const [starting, setStarting] = useState(false);
  const [listening, setListening] = useState(false);
  const [noOnespeakig, setNoOnespeakig] = useState(false);
  
  const [source, setSource] = useState('zh-CN,en-US');
  const [target, setTarget] = useState('');
  const [showTranslate, setShowTranslate] = useState(false);
  const [visible, setVisible] = useState(false);
  const [toolVisible, setToolVisible] = useState(true);
  const [rttVisible, setRttVisible] = useState(true);
  const [isRunoutTime, setIsRunoutTime] = useState(false);
  
  const visibleTaskRef = useRef<Scheduler.Task | null>(null);
  const rttListRef = useRef(rttList);
  const portalTargetList = document.getElementsByClassName('fcr-toolbox-popover-item-dropbox')
  const showSetting = () => {
    const portalTargetElement1 = portalTargetList[portalTargetList.length - 1];
    const portalTargetElement2 = portalTargetList[portalTargetList.length - 2];
    if(portalTargetElement1){
      ReactDOM.render(<SetttingPopo />, portalTargetElement1)
    }
    if(portalTargetElement2){
      ReactDOM.render(<SetttingPopo />, portalTargetElement2)
    }
   

  };
  const scrollToBottom = () => {
    if (rttContainerRef.current) {
      rttContainerRef.current.scrollTop = rttContainerRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [rttList]);
  useEffect(()=>{
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ChangeRttlanguage,
      onMessage: (data) => {
        console.log("接收到的数据", data)
      }
    });
  },[])
  useEffect(() => {
    const timer = setInterval(() => {

      setCountdown((prevCountdown) => {
        if (prevCountdown <= 0) {
          setIsRunoutTime(true)
          clearInterval(timer);
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!visible) return false
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
  }, [rttVisible,rttList,starting,visible]);
  useEffect(() => {
    showSetting()
  }, [toolVisible, visible]);
  const SetttingPopo: React.FC = () => {
    // 查看实时转写
    const viewRtt = () => {
      setVisible(true)
      setPopoverVisible(false)
      widget.classroomStore.connectionStore.scene?.on('stream-message-recieved', decodeProto);
          start();
    }
    return (
      // 
      <Popover
            onVisibleChange={setPopoverVisible}
            content={
              <RttSettings
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
                debugger
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
  
  const getApaasToken = async (user: string) => {
    const sceneId = widget.classroomStore.connectionStore.scene?.sceneId || '';
    const res = await axios.get<{
      data: {
        streamUuid: string;
        rtcToken: string;
        appId: string;
        roomUuid: string;
      };
    }>(
      `${process.env.NODE_ENV === 'development'
        ? widget.classroomConfig.host
        : 'https://api-solutions-pre.bj2.agoralab.co'
      }/edu/v2/rooms/${sceneId}/streams/${user}/token`,
    );
    return res.data.data;
  };

  const getRttToken = async (appId: string) => {
    const sceneId = widget.classroomStore.connectionStore.scene?.sceneId;
    const res = await axios.post<{ createTs: number; instanceId: string; tokenName: string }>(
      `https://api.agora.io/v1/projects/${appId}/rtsc/speech-to-text/builderTokens`,
      {
        instanceId: sceneId,
      },
      {
        headers: {
          Authorization:
            'Basic OGJmMzUzMzM1MjA2NDg1NThhZDFiNzM2Y2ZhNWQyZjE6NzQ1NDIxYzgxYWJiNGFjOWExZmM3YzdlNTBlOTE5OTk=',
          'Content-Type': 'application/json',
        },
      },
    );
    return res.data;
 
  };
  const changeRtt = async (state:number) => {
    const sceneId = widget.classroomStore.connectionStore.scene?.sceneId;
    const {
      rteEngineConfig: { ignoreUrlRegionPrefix, region },
      appId,
      //@ts-ignore
    } = window.EduClassroomConfig;
    const data = {
      languages: {
                source: localStorage.getItem("sourceLanguageId") || 'zh-CN',
                target: [localStorage.getItem("translatelanguageId") || 'en-US'],
                // source: 'zh-CN',
                // target: ['en-US'],
              },
              transcribe: 0,
              subtitle:1
    };
    const pathPrefix = `${
      ignoreUrlRegionPrefix ? '' : '/' + region.toLowerCase()
    }/edu/apps/${appId}`;
    widget.classroomStore.api.fetch({
      path: `/v2/rooms/${sceneId}/widgets/rtt/states/${state}`,
      method: 'PUT',
      data: {
        ...data
      },
      pathPrefix,
    });
  };
  const stop = async ()=>{
    await changeRtt(0);
    setRttVisible(false)
    setVisible(false)
    setIsRunoutTime(true)
  }
  const start = async () => {
    setStarting(true);
    try {
      await changeRtt(1);
    } finally {
    }
  };
  useEffect(() => {
  if(starting){
    const timer = setTimeout(() => {
      setStarting(false)
      setListening(true)
    }, 2000);
    return () => clearTimeout(timer);
  }
  }, [starting]);
  useEffect(() => {
    if(listening){
      const timer = setTimeout(() => {
       setListening(false)
       setNoOnespeakig(true)
      }, 2000);
      return () => clearTimeout(timer);
    }
    }, [listening]);
    useEffect(() => {
      if(noOnespeakig){
        const timer = setTimeout(() => {
         setNoOnespeakig(false)
        }, 3000);
        return () => clearTimeout(timer);
      }
      }, [noOnespeakig]);


  const decodeProto = (uid: string, data: Uint8Array) => {
    setRttVisible(true)
    setVisible(true)
    const pb = protoRoot.lookup('Text');
    if (pb) {
      //@ts-ignore
      const textstream = pb.decode(data);
      const lastItemByUid = rttListRef.current.findLast((item) => item.uid === textstream.uid);
      const lastItemIndexByUid = rttListRef.current.findLastIndex(
        (item) => item.uid === textstream.uid,
      );
      switch (textstream.dataType) {
        case 'transcribe':
          let textStr = '';
          let isFinal = false;
          let confidence = 0.0;

          //@ts-ignore
          textstream.words.forEach((word) => {
            textStr += word.text;
            confidence = word.confidence;
            isFinal = word.isFinal;
          });
          console.log('transcribe: ' + lastItemIndexByUid + textStr);

          if (!lastItemByUid || lastItemByUid.isFinal) {
            rttListRef.current = rttListRef.current
              .concat([
                {
                  uuid: uuidV4(),
                  culture: textstream.culture,
                  text: textStr,
                  uid: textstream.uid,
                  time: textstream.time,
                  isFinal: isFinal,
                  confidence: confidence,
                },
              ])
              .slice(-100);
          } else {
            rttListRef.current[lastItemIndexByUid] = {
              ...lastItemByUid,
              uuid: uuidV4(),
              text: textStr,
              time: textstream.time,
              isFinal: isFinal,
              confidence: confidence,
            };
          }

          break;
        case 'translate':
          console.log('Translation: ' + JSON.stringify(textstream));
          const trans: { culture: string; text: string }[] = [];
          //@ts-ignore
          textstream.trans.forEach((transItem) => {
            let transTextStr = '';
            //@ts-ignore
            transItem.texts.forEach((text) => {
              console.log('Translation: ' + lastItemIndexByUid + text);
              transTextStr += text;
            });
            trans.push({
              culture: transItem.lang,
              text: transTextStr,
            });
          });
          rttListRef.current[lastItemIndexByUid] = {
            ...lastItemByUid!,
            uuid: uuidV4(),
            trans,
          };

          break;
      }
      setRttList([...rttListRef.current]);
    }
  };
  useEffect(() => {
    console.log("rttList", rttList)
  }, [rttList]);

  useEffect(() => {
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttOptionsChanged,
      onMessage: handleRttOptionsChanged,
    });
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ToolboxChanged,
      onMessage: () => {
        showSetting()
      },
    });
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttboxChanged,
      onMessage: (data) => {
        if(data.visible){
          widget.classroomStore.connectionStore.scene?.on('stream-message-recieved', decodeProto);
          start();
        }else{
          widget.clsoe()
        }
        setVisible(data.visible)
      },
    });
    widget.broadcast(AgoraExtensionWidgetEvent.RequestRttOptions, '');
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
    start()
  };

  const enableTranslate = !!target;
  const showTranslateOnly = enableTranslate && !showTranslate;
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

  // 将秒数格式化为分钟和秒钟
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
  // 查看实时转写
  const viewRtt = () => {
    setVisible(true)
    setVisible(true)
    setPopoverVisible(false)
    widget.classroomStore.connectionStore.scene?.on('stream-message-recieved', decodeProto);
        start();
  }
  return (

    <div
      style={{ display: visible ? 'block' : 'none' }}
      className={classnames('fcr-rtt-widget-container','fcr-bg-black-a80', {
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
          <div onClick={()=>stop()} className="fcr-rtt-widget-action fcr-rtt-widget-close">
            <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16}></SvgImg>
          </div>
        </ToolTip>
      </div>
      {isRunoutTime && <div className="fcr-limited-box">
       <div className="fcr-limited-box-title">限时体验</div>
       每个账号限时10分钟体验字幕和转写功能，体验时间已用完。
      </div>}
       {!isRunoutTime && 
        <div className="fcr-limited-box">
       <div className="fcr-limited-box-title">限时体验</div>
       每个账号限时10分钟体验字幕和转写功能，剩余{formatTime(countdown)}分钟。
      </div>}
      {/* 开启中 */}
      {starting && !isRunoutTime && (
        <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center">
         <img src={loadingPng} style={{width:'20px',height:'20px',marginRight:'10px',verticalAlign:'middle',animation:'rotate 1s linear infinite',}}></img>
          {transI18n('fcr_subtitles_text_turn_on')} ...
        </div>
      )}
       {isRunoutTime && (
        <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center">
          {/* {transI18n('fcr_subtitles_text_turn_on')} ... */}
          暂无内容
        </div>
      )}
       {/* 正在聆听 */}
       {listening && !starting && !noOnespeakig && !isRunoutTime &&  (
        <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center">
          <SvgImg type={SvgIconEnum.FCR_V2_HEAR} size={16} style={{verticalAlign:'middle',marginRight:'10px',marginBottom:'4px'}}></SvgImg>
          {transI18n('fcr_subtitles_text_listening')} ...
        </div>
      )}
      {/* 没有人正在说话 */}
      {noOnespeakig && !starting && !translating && !isRunoutTime && (
        <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center">
          {transI18n('fcr_subtitles_text_no_one_speaking')}
        </div>
      )}
     
      {lastItemAvalible && !listening &&  !starting && !noOnespeakig && !isRunoutTime && (
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
