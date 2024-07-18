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
import { Scheduler } from 'agora-rte-sdk';
import { transI18n } from 'agora-common-libs';
import { Input } from '@components/input';
import { notification } from "antd";
import { Button } from '@components/button';
import { center } from '@antv/g2plot/lib/plots/sankey/sankey';
import { ToastApi } from '@components/toast';

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
  const [isOpenrtt, setIsOpenrtt] = useState(false);


  const [visible, setVisible] = useState(true);
  const [searchKey, setsearchKey] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const visibleTaskRef = useRef<Scheduler.Task | null>(null);
  const rttListRef = useRef(rttList);

  const scrollToBottom = () => {
    if (rttContainerRef.current) {
      rttContainerRef.current.scrollTop = rttContainerRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [rttList]);
  useEffect(() => {
    setVisible(true);
    visibleTaskRef.current?.stop();
    // if (!starting && !popoverVisible) {
    //   visibleTaskRef.current = Scheduler.shared.addDelayTask(() => {
    //     setVisible(false);
    //   }, 5000);
    // }
  }, [starting, rttList, popoverVisible]);

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

  const changeRtt = async (state: number) => {
    const sceneId = widget.classroomStore.connectionStore.scene?.sceneId;
    const {
      rteEngineConfig: { ignoreUrlRegionPrefix, region },
      appId,
      //@ts-ignore
    } = window.EduClassroomConfig;
    const data = {
      languages: {
        //         // source: localStorage.getItem("sourceLanguageId") || 'zh-CN',
        // target: [localStorage.getItem("translatelanguageId") || 'en-US'],
        source: 'zh-CN',
        target: ['en-US'],
      },
      transcribe: 1,
      subtitle: 0
    };
    const pathPrefix = `${ignoreUrlRegionPrefix ? '' : '/' + region.toLowerCase()
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


  const start = async () => {
    setStarting(true);
    try {
      await changeRtt(1);
      setIsOpenrtt(true)
    } finally {
      setStarting(false);
    }
  };


  const decodeProto = (uid: string, data: Uint8Array) => {
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
    // debugger
    // widget.classroomStore.connectionStore.scene?.on('stream-message-recieved', decodeProto);
    // start();
  }, []);

  useEffect(() => {
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttOptionsChanged,
      onMessage: handleRttOptionsChanged,
    });
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ChangeRttlanguage,
      onMessage: (data) => {
        console.log("接收到的数据", data)
        setTimeout(() => {
          ToastApi.open({
            toastProps: {
              type: 'normal',
              content: "老师(我) 开启了实时转写服务，全体用户可见。",
            },
          });
        }, 100);
      }
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

  // const result = text.replace(`/${searchQuery}/g`, (match) => {
  //     return `<span style="background-color: '#4262FF'">${newText}</span>`;
  // });


  const renderHighlightedText = (text: string) => {
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === searchQuery.toLowerCase() && part ? (
            <span key={index} className="highlighted">{part}</span>
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
    debugger
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
              value={searchKey}
              onChange={setSearchQuery}
              iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
              placeholder={transI18n('fcr_chat_label_search')}
            />
            <div style={{ display: 'flex', alignItems: 'center', position: 'absolute', right: '32px', top: '9px' }}>
              <span style={{ color: '#fff' }}>{`${currentIndex} / ${totalResults}`}</span>
              <div className="button-box" style={{ position: 'relative', height: '36px' }}>
                <SvgImg style={{ position: 'absolute', bottom: 0 }} type={SvgIconEnum.FCR_DROPDOWN4} onClick={() => handleArrowClick('down')}></SvgImg>
                <SvgImg style={{ position: 'absolute', top: 0 }} type={SvgIconEnum.FCR_DROPUP4} onClick={() => handleArrowClick('up')}></SvgImg>
              </div>
            </div>
          </div>
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
          <div className="rtt-list">
            <div style={{textAlign:'center'}}>
              <div className="open-language">开启翻译识别内容</div>
            </div>

            {filteredRttList.map(item => (

              <div key={item.uuid} className="fcr-rtt-widget-text">
                <Avatar textSize={14} size={30} nickName={widget.classroomStore.streamStore.streamByStreamUuid.get(String(item.uid))?.fromUser.userName}></Avatar>
                <div>
                  <div className="fcr-rtt-widget-name">{widget.classroomStore.streamStore.streamByStreamUuid.get(String(item.uid))?.fromUser.userName}:</div>
                  <div className="fcr-rtt-widget-transcribe">

                    {/* <rich-text nodes="<div>这里是富文本内容</div>"></rich-text> */}
                    {enableTranslate && !showTranslate ? item.trans?.find(transItem => transItem.culture === target)?.text : renderHighlightedText(item.text)}
                  </div>
                  {enableTranslate && showTranslate && (
                    <div className="fcr-rtt-widget-translate">{item.trans?.find(transItem => transItem.culture === target)?.text}</div>
                  )}
                </div>
              </div>
            ))}

          </div>
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

          {starting && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full">
              {transI18n('fcr_subtitles_text_turn_on')} ...
            </div>
          )}
          {!lastItemAvalible && !starting && !translating && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full">
              {transI18n('fcr_subtitles_text_no_one_speaking')}
            </div>
          )}
          {translating && !starting && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full">
              {transI18n('fcr_subtitles_text_listening')} ...
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
            {isOpenrtt && <button className="stop-button" onClick={() => changeRtt(0)}>{transI18n('fcr_rtt_stop_transcription')}</button>}
            {!isOpenrtt && <button className="stop-button" onClick={() => { changeRtt(1); widget.classroomStore.connectionStore.scene?.on('stream-message-recieved', decodeProto); }}>{transI18n('fcr_rtt_start_transcription')}</button>}
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
              }}>
              {/* toolTipProps={{ content: transI18n('fcr_subtitles_button_subtitles_setting') }} */}
              <button className="settings-button">{transI18n('fcr_rtt_settings')}</button>
            </PopoverWithTooltip>
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
