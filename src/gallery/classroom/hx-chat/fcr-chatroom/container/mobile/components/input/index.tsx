import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import { useStore } from '../../../../hooks/useStore';
import { emojis } from '../../../../utils/emoji';
import './index.css';
import { useI18n } from 'agora-common-libs';
import { useClickAnywhere } from '../../../../utils/hooks';
import classNames from 'classnames';
import ChatDialog from '../chat-dialog';
import ApplicationDialog from '../application-dialog';
import ParticipantDialog from '../participant-dialog';

export const FcrChatRoomH5Inputs = observer(
  ({
    showEmoji,
    onShowEmojiChanged,
    emojiContainer,
    screenShareStream,
  }: {
    showEmoji: boolean;
    screenShareStream: any;
    onShowEmojiChanged: (show: boolean) => void;
    emojiContainer: HTMLDivElement | null;
  }) => {
    const [inputFocus, setInputFocus] = useState(false);
    const [text, setText] = useState('');
    const [isShowStudents, setIsShowStudents] = useState(false);
    const [isShowChat, setIsShowChat] = useState(false);
    const [isShowApplication, setIsShowApplication] = useState(false);
    const [collectVisible, setCollectVisible] = useState(false);
    const [widgetCount, setWidgetCount] = useState(0);
    const [isShowParticipant, setIsShowParticipant] = useState(false);
    const [whiteTooltip, setWhiteTooltip] = useState(true);
    const transI18n = useI18n();

    const {
      roomId,
      isShowPoll,
      messageStore: { isopenChatDialog },
      roomStore: {
        isLandscape,
        forceLandscape,
        z0Widgets,
        addToast,
      },
      userStore: {
        setSearchKey,
        isRaiseHand,
        raiseHand,
        lowerHand,
        allUIStreamsCount:allStreamCount,
      },

    } = useStore();
    const widgets = z0Widgets.filter((v: { widgetName: string; }) => v.widgetName !== 'easemobIM');

    const closeCollectTip = () => {
      setCollectVisible(false);
    };
    useEffect(() => {
      document.body.addEventListener('click', closeCollectTip);
      return () => {
        document.body.removeEventListener('click', closeCollectTip);
      };
    }, []);
    useEffect(() => {
      let timer: NodeJS.Timeout | null = null;
      if (collectVisible) {
        timer = setTimeout(() => {
          setCollectVisible(false);
        }, 5000);
      }
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }, [collectVisible]);
    useEffect(() => {
      const count = widgets.length > 0 ? widgets.length : 0;
      if (isShowPoll) {
        setWidgetCount(count + 1)
      } else {
        setWidgetCount(count)
      }
    }, [widgets.length, isShowPoll])
    useEffect(() => {
      const count = widgets.length > 0 ? widgets.length : 0;
      if (isShowPoll) {
        setWidgetCount(count + 1)
      } else {
        setWidgetCount(count)
      }
    }, [widgets.length, isShowPoll])
    useEffect(() => {
      if (isShowPoll) {
        addToast(transI18n('frc_more_white_showpoll_tooltip'), 'success');
      }
    }, [isShowPoll])
    useEffect(() => {
      if (whiteTooltip) {
        if (widgets.find((widget: any) => {
          return widget.widgetName == 'mediaPlayer' || widget.widgetName == 'netlessBoard' || widget.widgetName == 'webView'
        }) != null) {
          addToast(transI18n('frc_more_white_tooltip'), 'success');
          setWhiteTooltip(false);
        }
      }
    }, [widgets.length])
    useEffect(() => {
      const obj = window.localStorage.getItem('application-room-id');
      if (widgets.length > 0 && (!obj || (obj && JSON.parse(obj).roomId !== roomId))) {
        const applicationObj = {
          roomId: roomId,
        };
        window.localStorage.setItem('application-room-id', JSON.stringify(applicationObj));
        setCollectVisible(true);
      } else {
        setCollectVisible(false);
      }
    }, [widgets.length, roomId]);


    useEffect(() => {
      if (isopenChatDialog) {
        setIsShowParticipant(false);
        setIsShowChat(true);
      }
    }, [isopenChatDialog])

    const handleEmojiClick = (emoji: string) => {
      // setText((prev) => prev + emoji);
    };

    const handleShowDialog = () => {
      setIsShowChat(!isShowChat);
      setSearchKey('');
    };
    //显示花名册
    const handleShowParticipantDialog = () => {
      setIsShowParticipant(!isShowParticipant);
      setSearchKey('');
    };
    const [isHidePrivate, setIsHidePrivate] = useState(false);

    useEffect(() => {
      let resizeObserver: ResizeObserver | undefined = undefined;
      // 选择你想要监听的DOM元素
      const element = document.querySelector('.fcr-chatroom-mobile-inputs-input-main');
      if (element) {
        // 创建一个ResizeObserver实例并定义回调函数
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const width = entry.contentRect.width;
            console.log('element', width);
            if (width <= 110) {
              setIsHidePrivate(true);
            } else {
              setIsHidePrivate(false);
            }
          }
        });
        // 开始监听元素的尺寸变化
        resizeObserver.observe(element);
      }
      return () => {
        resizeObserver?.disconnect();
      };
    }, []);
    
    const handleShowApplicatioon = (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      const haveShare = isLandscape && screenShareStream;
      if (!haveShare) {
        if (widgetCount === 0) {
          addToast(transI18n('fcr_teacher_no_use_textbooks'), 'warning');
          return;
        }
      }
      setIsShowApplication(!isShowApplication);
    };

    return (
      <>
        <div
          className={classNames('fcr-chatroom-mobile-inputs', {
            'fcr-chatroom-mobile-inputs-landscape': isLandscape,
          })}
          style={{
            zIndex: 1,
          }}>
          {/* 竖屏 */}
          {!isLandscape && (
            <div className="fcr-application-panel-wrapped">
              <div
                className='fcr-application-panel-item'
                onClick={isRaiseHand ? lowerHand : raiseHand}
              >
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={isRaiseHand ? SvgIconEnum.HANDS_UP_NEW : SvgIconEnum.HANDS}
                />
                <span>{transI18n(isRaiseHand ? 'chat.lower' : 'chat.raise')}</span>
              </div>
              <div
                className='fcr-application-panel-item'
                onClick={handleShowDialog}
              >
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.CHAT_NEW}
                />
                <span>{transI18n('chat.chat')}</span>
              </div>
              <div className='fcr-application-panel-item' onClick={handleShowParticipantDialog}>
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.GROUP}
                />
                <span>{transI18n('chat.participants', { num: allStreamCount || 0 })}</span>
              </div>
              {widgetCount > 0 && <div className='fcr-application-panel-item fcr-application-panel-item-more' onClick={handleShowApplicatioon}>
                {/* <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.MORE_NEW}
                  size={30}
                /> */}
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.APPLICATION}
                  size={30}></SvgImgMobile>
                <span className="fcr-chatroom-mobile-inputs-application-count">
                  {widgetCount > 99 ? '...' : widgetCount}
                </span>
                <span>{transI18n('chat.more')}</span>
              </div>}
            </div>
          )}

          {/* 横屏 */}
          {isLandscape && (
            <div className="fcr-chatroom-mobile-inputs-mobile-content fcr-application-panel-wrapped">
              <div
                className='fcr-application-panel-item'
                onClick={isRaiseHand ? lowerHand : raiseHand}
              >
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={isRaiseHand ? SvgIconEnum.HANDS_UP_NEW : SvgIconEnum.HANDS}
                />
                <span>{transI18n(isRaiseHand ? 'chat.lower' : 'chat.raise')}</span>
              </div>
              <div
                className='fcr-application-panel-item'
                onClick={handleShowDialog}
              >
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.CHAT_NEW}
                />
                <span>{transI18n('chat.chat')}</span>
              </div>
              <div className='fcr-application-panel-item' onClick={handleShowParticipantDialog}>
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.GROUP}
                />
                <span>{allStreamCount || 0}</span>
              </div>
              {widgetCount > 0 && <div className='fcr-application-panel-item' onClick={handleShowApplicatioon}>
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.APPLICATION}
                  size={30}></SvgImgMobile>
                <span className="fcr-chatroom-mobile-inputs-application-count fcr-application-panel-item-more">
                  {widgetCount > 99 ? '...' : widgetCount}
                </span>
                <span>{transI18n('chat.more')}</span>
              </div>}

              {/* <div className="fcr-chatroom-mobile-inputs-mobile-right">
                <ToolTip
                  placement="topLeft"
                  content={transI18n('fcr_teacher_use_collected_tip')}
                  visible={collectVisible}>
                  <div
                    className={classNames(
                      'fcr-chatroom-mobile-inputs-application landscape',
                      isLandscape ? widgets.length === 0 && 'zero' : 1,
                      isShowApplication && 'active',
                    )}
                    onClick={handleShowApplicatioon}>
                    <SvgImgMobile
                      forceLandscape={forceLandscape}
                      landscape={isLandscape}
                      type={SvgIconEnum.APPLICATION}
                      size={30}></SvgImgMobile>
                    <span className="fcr-chatroom-mobile-inputs-application-count">
                      {widgets.length > 99 ? '...' : widgets.length}
                    </span>
                  </div>
                </ToolTip>
              </div> */}
            </div>
          )}
        </div>
        {isShowApplication && <ApplicationDialog setIsShowApplication={setIsShowApplication} />}
        {isShowChat && <ChatDialog setIsShowChat={setIsShowChat} />}
        {isShowParticipant && <ParticipantDialog setIsShowParticipant={setIsShowParticipant}/>}
        {/* {isShowMore && <MoreDialog setIsShowMore = {setIsShowMore}/>} */}
        {showEmoji && emojiContainer && (
          <EmojiContainer
            onOuterClick={() => onShowEmojiChanged(false)}
            portal={emojiContainer}
            onClick={handleEmojiClick}></EmojiContainer>
        )}
      </>
    );
  },
);
const EmojiContainer = observer(
  ({
    onClick,
    portal,
    onOuterClick,
  }: {
    onClick: (emoji: string) => void;
    portal: HTMLDivElement;
    onOuterClick: () => void;
  }) => {
    const ref = useClickAnywhere(() => {
      onOuterClick();
    });
    const {
      roomStore: { isLandscape },
    } = useStore();
    return createPortal(
      <div
        ref={ref}
        className={classNames('fcr-chatroom-mobile-input-emoji-container', {
          'fcr-chatroom-mobile-input-emoji-container-landscape': isLandscape,
        })}
        style={{ zIndex: 20 }}>
        {emojis.map((emoji) => {
          return (
            <div
              key={emoji}
              onClick={() => {
                onClick(emoji);
              }}>
              {emoji}
            </div>
          );
        })}
      </div>,
      portal,
    );
  },
);
