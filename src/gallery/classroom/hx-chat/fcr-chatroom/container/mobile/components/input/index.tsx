import { observer } from 'mobx-react';
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import { useStore } from '../../../../hooks/useStore';
import { ThumbsUp } from '../thumbs-up';
import { emojis } from '../../../../utils/emoji';
import './index.css';
import { useI18n } from 'agora-common-libs';
import { useClickAnywhere } from '../../../../utils/hooks';
import classNames from 'classnames';
import { AgoraExtensionWidgetEvent } from '../../../../../../../../events';
import { MobileCallState } from '../../../../store/room';

export const FcrChatRoomH5Inputs = observer(
  ({
    showEmoji,
    onShowEmojiChanged,
    emojiContainer,
  }: {
    showEmoji: boolean;
    onShowEmojiChanged: (show: boolean) => void;
    emojiContainer: HTMLDivElement | null;
  }) => {
    const [inputFocus, setInputFocus] = useState(false);
    const [text, setText] = useState('');
    const transI18n = useI18n();

    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
      broadcastWidgetMessage,
      messageStore: { sendTextMessage, sendImageMessage },
      roomStore: {
        allMuted,
        isLandscape,
        messageVisible,
        setMessageVisible,
        forceLandscape,
        landscapeToolBarVisible,
        quitForceLandscape,
        mobileCallState,
      },
      userStore: { userMuted },
    } = useStore();
    const getCallIcon = () => {
      switch (mobileCallState) {
        case MobileCallState.Initialize:
          return {
            icon: SvgIconEnum.CALL_MOBILE,
            colors: {
              iconPrimary: undefined,
              iconSecondary: undefined,
            },
          };
        case MobileCallState.VideoAndVoiceCall:
          return {
            icon: SvgIconEnum.CALLING_MOBILE,
            colors: {
              iconPrimary: 'rgba(66, 98, 255, 1)',
              iconSecondary: 'rgba(66, 98, 255, 1)',
            },
          };
        case MobileCallState.VoiceCall:
          return {
            icon: SvgIconEnum.CALLING_MOBILE,
            colors: {
              iconPrimary: 'rgba(66, 98, 255, 1)',
              iconSecondary: '#fff',
            },
          };
        case MobileCallState.VideoCall:
          return {
            icon: SvgIconEnum.CALLING_MOBILE,
            colors: {
              iconPrimary: '#fff',
              iconSecondary: 'rgba(66, 98, 255, 1)',
            },
          };
        case MobileCallState.DeviceOffCall:
          return {
            icon: SvgIconEnum.CALLING_MOBILE,
            colors: {
              iconPrimary: '#fff',
              iconSecondary: '#fff',
            },
          };
        default:
          return {
            icon: SvgIconEnum.CALL_MOBILE,
            colors: {
              iconPrimary: undefined,
              iconSecondary: undefined,
            },
          };
      }
    };
    const isMuted = allMuted || userMuted;
    const send = useCallback(() => {
      sendTextMessage(text);
      setText('');
      onShowEmojiChanged(false);
      inputRef.current?.blur();
    }, [text, sendTextMessage]);
    const handleImgInputClick = () => {
      fileInputRef.current?.focus();
      fileInputRef.current?.click();
    };
    const handleFileInputChange = () => {
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        sendImageMessage(file);
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
    const inputVisible = (messageVisible && landscapeToolBarVisible) || !isLandscape;
    return (
      <>
        <div
          className="fcr-chatroom-mobile-inputs"
          style={{
            visibility: landscapeToolBarVisible ? 'visible' : 'hidden',
            opacity: landscapeToolBarVisible ? 1 : 0,
            transition: 'visibility .2s, opacity .2s',
            zIndex: 1,
            background:
              isLandscape && (showEmoji || inputFocus)
                ? '#fff'
                : isLandscape
                ? 'transparent'
                : '#27292f',
          }}>
          <div
            className={classNames('fcr-chatroom-mobile-inputs-input', {
              'fcr-chatroom-mobile-inputs-input-force-landscape': forceLandscape,
            })}
            style={{
              visibility: inputVisible ? 'visible' : 'hidden',
              opacity: inputVisible ? 1 : 0,
              transition: 'opacity .2s',
            }}>
            <div className="fcr-chatroom-mobile-inputs-input-wrap">
              <div className="fcr-chatroom-mobile-inputs-input-outline"></div>
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

              <input
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
                }></input>
            </div>

            {!isMuted && !forceLandscape && (
              <>
                <div className="fcr-chatroom-mobile-inputs-image" onClick={handleImgInputClick}>
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
              {isLandscape && (
                <div
                  className="fcr-chatroom-mobile-inputs-hide-message"
                  onClick={toggleMessageVisible}>
                  {messageVisible ? (
                    <SvgImgMobile
                      forceLandscape={forceLandscape}
                      landscape={isLandscape}
                      type={SvgIconEnum.MESSAGE_OEPNED}
                      size={30}></SvgImgMobile>
                  ) : (
                    <SvgImgMobile
                      forceLandscape={forceLandscape}
                      landscape={isLandscape}
                      type={SvgIconEnum.MESSAGE_CLOSED}
                      size={30}></SvgImgMobile>
                  )}
                </div>
              )}
              <>
                <input
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/*"
                  type="file"
                  style={{ display: 'none' }}></input>
              </>

              <div className="fcr-chatroom-mobile-inputs-call" onClick={openHandsUpActionSheet}>
                {mobileCallState === MobileCallState.Processing && (
                  <div className="fcr-chatroom-mobile-inputs-call-loading">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                )}

                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={getCallIcon().icon}
                  colors={{ ...getCallIcon().colors }}
                  size={30}></SvgImgMobile>
              </div>
              <ThumbsUp></ThumbsUp>
            </>
          )}
        </div>
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
