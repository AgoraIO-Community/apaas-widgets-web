import { observer } from 'mobx-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import { useStore } from '../../../../hooks/useStore';
import { emojis } from '../../../../utils/emoji';
import './index.css';
import { useI18n } from 'agora-common-libs';
import { useClickAnywhere } from '../../../../utils/hooks';
import classNames from 'classnames';
import { AgoraExtensionWidgetEvent } from '../../../../../../../../events';
import { MobileCallState } from '../../../../store/room';
import { ToolTip } from '../tooltip';
import MoreDialog from '../more-dialog';
import PrivateDialog from '../private-dialog';
import ApplicationDialog from '../application-dialog';

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
    const [isShowMore,setIsShowMore] = useState(false);
    const [isShowApplication, setIsShowApplication] = useState(false);
    const [collectVisible, setCollectVisible] = useState(false);
    const transI18n = useI18n();

    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
      roomId,
      broadcastWidgetMessage,
      messageStore: { sendTextMessage, sendImageMessage },
      roomStore: {
        pollMinimizeState,
        allMuted,
        isLandscape,
        messageVisible,
        setMessageVisible,
        forceLandscape,
        landscapeToolBarVisible,
        quitForceLandscape,
        mobileCallState,
        z0Widgets,
        addToast,
        currentWidget, // 当前正在使用的widget-不能删
        isBreakOutRoomEnabled,
        isBreakOutRoomDisable,
        isBreakOutRoomIn,
      },
      userStore: {
        userList,
        setSearchKey,
        privateUser,
        userMuted,
        isRaiseHand,
        raiseHand,
        lowerHand,
        raiseHandTooltipVisible,
      },
    } = useStore();
    const widgets = z0Widgets.filter((v: { widgetName: string; }) => v.widgetName !== 'easemobIM');
    const getCallIcon = () => {
      switch (mobileCallState) {
        case MobileCallState.Initialize:
          return {
            icon: SvgIconEnum.DEVICE_OFF_CALL_MOBILE,
          };
        case MobileCallState.VideoAndVoiceCall:
          return {
            icon: SvgIconEnum.CALLING_MOBILE,
          };
        case MobileCallState.VoiceCall:
          return {
            icon: SvgIconEnum.VOICE_CALLING_MOBILE,
          };
        case MobileCallState.VideoCall:
          return {
            icon: SvgIconEnum.VIDEO_CALLING_MOBILE,
          };
        case MobileCallState.DeviceOffCall:
          return {
            icon: SvgIconEnum.DEVICE_OFF_CALL_MOBILE,
          };
        default:
          return {
            icon: SvgIconEnum.DEVICE_OFF_CALL_MOBILE,
          };
      }
    };
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
    const isMuted = allMuted || userMuted;
    const send = () => {
      // sendTextMessage(text);

      const isPrivateInRoom = userList.find((v) => v.userId === privateUser?.userId);
      if (!isPrivateInRoom && privateUser?.userId) {
        addToast(transI18n('fcr_private_leave_room', { reason: privateUser?.nickName }), 'warning');
      }
      sendTextMessage(text, privateUser ? [privateUser] : undefined);
      setText('');
      onShowEmojiChanged(false);
      inputRef.current?.blur();
    };
    const handleImgInputClick = () => {
      fileInputRef.current?.focus();
      fileInputRef.current?.click();
    };
    const handleFileInputChange = () => {
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        sendImageMessage(file, privateUser ? [privateUser] : undefined);
      }
    };
    const handleEmojiClick = (emoji: string) => {
      setText((prev) => prev + emoji);
    };
    const toggleMessageVisible = () => {
      setMessageVisible(!messageVisible);
    };
    const openHandsUpActionSheet = () => {
      broadcastWidgetMessage(AgoraExtensionWidgetEvent.OpenMobileHandsUpActionSheet, undefined);
    };
    const inputVisible =
      (messageVisible && landscapeToolBarVisible && pollMinimizeState) || !isLandscape;

    const handleShowDialog = () => {
      setIsShowStudents(!isShowStudents);
      setSearchKey('');
    };
    const handleShowMoreDialog=()=>{
      setIsShowMore(!isShowMore);
    }
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
        if (widgets.length === 0) {
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
              <div className='fcr-application-panel-item'>
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.GROUP}
                />
                <span>{transI18n('chat.participants', { num: 3 })}</span>
              </div>
              {/* Chat */}
              <div className='fcr-application-panel-item' onClick={handleShowApplicatioon}>
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.MORE_NEW}
                  size={30}
                />
                <span>{transI18n('chat.more')}</span>
              </div>
            </div>
          )}

          {isLandscape && (
            <div className="fcr-chatroom-mobile-inputs-mobile-content">
              <div
                className="fcr-chatroom-mobile-inputs-mobile-left"
                style={{
                  visibility: landscapeToolBarVisible ? 'visible' : 'hidden',
                  opacity: landscapeToolBarVisible ? 1 : 0,
                  transition: 'visibility .2s, opacity .2s',
                }}>
                {text ? null : (
                  <div
                    className="fcr-chatroom-mobile-inputs-hide-message"
                    onClick={toggleMessageVisible}>
                    {messageVisible ? (
                      <SvgImgMobile
                        forceLandscape={forceLandscape}
                        landscape={isLandscape}
                        type={
                          isLandscape ? SvgIconEnum.MESSAGE_OPENED_NEW : SvgIconEnum.MESSAGE_OEPNED
                        }
                        size={30}></SvgImgMobile>
                    ) : (
                      <SvgImgMobile
                        forceLandscape={forceLandscape}
                        landscape={isLandscape}
                        type={
                          isLandscape ? SvgIconEnum.MESSAGE_CLOSED_NEW : SvgIconEnum.MESSAGE_CLOSED
                        }
                        size={30}></SvgImgMobile>
                    )}
                  </div>
                )}
                <div className="fcr-chatroom-mobile-inputs-mobile-left-main">
                  <div
                    className="fcr-chatroom-mobile-private"
                    style={{
                      visibility: inputVisible ? 'visible' : 'hidden',
                      opacity: inputVisible ? 1 : 0,
                      transition: 'opacity .2s',
                    }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      {transI18n('fcr_chat_label_i_said_to')}&nbsp;:
                    </span>
                    <div
                      className="fcr-chatroom-mobile-inputs-private-select"
                      onClick={handleShowDialog}>
                      <span className="fcr-chatroom-mobile-inputs-private-select-val">
                        {privateUser?.userId
                          ? privateUser.nickName
                          : isBreakOutRoomEnabled && isBreakOutRoomIn ? transI18n('chat.chat_option_my_group') :
                            isBreakOutRoomEnabled && !isBreakOutRoomIn ? transI18n('chat.chat_option_main_room') : transI18n('chat.chat_option_all')}
                      </span>
                      <SvgImgMobile
                        forceLandscape={forceLandscape}
                        landscape={isLandscape}
                        type={SvgIconEnum.PRIVATE_SELECT}
                        size={16}></SvgImgMobile>
                    </div>
                  </div>
                  <div
                    className="fcr-chatroom-mobile-inputs-input fcr-chatroom-mobile-inputs-input-force-landscape"
                    style={{
                      visibility: inputVisible ? 'visible' : 'hidden',
                      opacity: inputVisible ? 1 : 0,
                      transition: 'opacity .2s',
                    }}>
                    <div className="fcr-chatroom-mobile-inputs-input-wrap">
                      {isMuted && (
                        <div className="fcr-chatroom-mobile-inputs-input-muted">
                          <SvgImgMobile
                            forceLandscape={forceLandscape}
                            landscape={isLandscape}
                            type={SvgIconEnum.MUTE}
                            size={30}></SvgImgMobile>
                          {allMuted ? (
                            <p>{transI18n('chat.all_muted')}...</p>
                          ) : (
                            <p>{transI18n('chat.single_muted')}...</p>
                          )}
                        </div>
                      )}
                      {forceLandscape && (
                        <div className="fcr-chatroom-mobile-inputs-input-quit-landscape">
                          {transI18n('fcr_H5_button_chat')}
                          <SvgImgMobile
                            forceLandscape={forceLandscape}
                            type={SvgIconEnum.QUIT_LANDSCAPE}
                            size={30}
                            landscape={isLandscape}></SvgImgMobile>
                        </div>
                      )}
                      {privateUser && (
                        <div className="fcr-chatroom-mobile-inputs-private-icon private">
                          <div className="fcr-chatroom-mobile-inputs-private-icon-svg">
                            <SvgImgMobile
                              forceLandscape={forceLandscape}
                              landscape={isLandscape}
                              type={SvgIconEnum.PRIVATE}
                              size={16}></SvgImgMobile>
                          </div>
                          {!isHidePrivate && (
                            <span className="fcr-chatroom-mobile-inputs-private-icon-val">
                              {transI18n('chat.private')}
                            </span>
                          )}
                        </div>
                      )}
                      {inputFocus && (
                        <>
                          <div className="fcr-chatroom-mobile-inputs-input-outline private"></div>
                          <div className="fcr-chatroom-mobile-inputs-input-outline active"></div>
                        </>
                      )}
                      <input
                        className={classNames(
                          'fcr-chatroom-mobile-inputs-input-main',
                          privateUser && 'private',
                        )}
                        onFocus={() => {
                          if (forceLandscape) {
                            quitForceLandscape();
                            inputRef.current?.focus();
                          }
                          setInputFocus(true);
                        }}
                        onBlur={() => {
                          setInputFocus(false);
                        }}
                        disabled={isMuted}
                        ref={inputRef}
                        onSubmit={send}
                        value={forceLandscape ? '' : text}
                        onChange={(e) => {
                          setText(e.target.value);
                        }}
                        multiple={false}
                        type={'text'}
                        placeholder={
                          isMuted || forceLandscape ? '' : `${transI18n('chat.enter_contents')}...`
                        }
                      />
                      {!isMuted && !forceLandscape && (
                        <>
                          <div
                            className="fcr-chatroom-mobile-inputs-image"
                            onClick={handleImgInputClick}>
                            <SvgImgMobile
                              forceLandscape={forceLandscape}
                              landscape={isLandscape}
                              type={SvgIconEnum.CHAT_IMAGE}
                              size={30}></SvgImgMobile>
                          </div>
                          <div className="fcr-chatroom-mobile-inputs-input-emoji">
                            {showEmoji ? (
                              <SvgImgMobile
                                forceLandscape={forceLandscape}
                                landscape={isLandscape}
                                type={SvgIconEnum.KEYBOARD}
                                onClick={() => {
                                  inputRef.current?.focus();
                                  onShowEmojiChanged(false);
                                }}
                                size={30}></SvgImgMobile>
                            ) : (
                              <SvgImgMobile
                                forceLandscape={forceLandscape}
                                landscape={isLandscape}
                                type={SvgIconEnum.CHAT_EMOJI}
                                onClick={() => {
                                  onShowEmojiChanged(true);
                                }}
                                size={30}></SvgImgMobile>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {text ? (
                  <div className="fcr-chatroom-mobile-inputs-send">
                    <SvgImgMobile
                      forceLandscape={forceLandscape}
                      landscape={isLandscape}
                      type={SvgIconEnum.VECTOR}
                      onClick={send}
                      size={36}></SvgImgMobile>
                  </div>
                ) : (
                  <>
                    <>
                      <input
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        accept="image/*"
                        type="file"
                        style={{ display: 'none' }}></input>
                    </>
                    <ToolTip
                      content={transI18n('fcr_participants_tips_lower_hand')}
                      visible={raiseHandTooltipVisible}>
                      <div
                        onClick={isRaiseHand ? lowerHand : raiseHand}
                        className={classNames('fcr-chatroom-mobile-inputs-raise-hand landscape', {
                          'fcr-chatroom-mobile-inputs-raise-hand-active': isRaiseHand,
                        })}>
                        <SvgImgMobile
                          type={SvgIconEnum.RAAISE_HANDS}
                          size={18}
                          landscape={isLandscape}
                          forceLandscape={forceLandscape}></SvgImgMobile>
                      </div>
                    </ToolTip>

                  </>
                )}
              </div>
              <div className="fcr-chatroom-mobile-inputs-mobile-right">
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
              </div>
            </div>
          )}
        </div>
        {isShowApplication && <ApplicationDialog setIsShowApplication={ setIsShowApplication} />}
        {isShowStudents && <PrivateDialog setIsShowStudents={setIsShowStudents} />}
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
