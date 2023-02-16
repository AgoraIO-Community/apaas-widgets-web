import { observer } from 'mobx-react';
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../components/svg-img';
import { useStore } from '../../../../hooks/useStore';
import { Thumbsup } from '../thumbsup';
import { emojis } from '../../../../utils/emoji';

import './index.css';
import { ComponentLevelRulesMobile } from '../../../../../../../../../agora-classroom-sdk/src/infra/capabilities/config';
import { useI18n } from 'agora-common-libs';
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
      messageStore: { sendTextMessage, sendImageMessage },
      roomStore: { allMuted, isLandscape, messageVisible, setMessageVisible, forceLandscape },
      userStore: { userMuted },
    } = useStore();

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

    return (
      <>
        <div
          className="fcr-chatroom-h5-inputs"
          style={{
            zIndex: ComponentLevelRulesMobile.Level1,
            background:
              isLandscape && (showEmoji || inputFocus)
                ? '#fff'
                : isLandscape
                ? 'transparent'
                : '#27292f',
          }}>
          <div
            className="fcr-chatroom-h5-inputs-input"
            style={{
              visibility: messageVisible || !isLandscape ? 'visible' : 'hidden',
            }}>
            <div className="fcr-chatroom-h5-inputs-input-wrap">
              <div className="fcr-chatroom-h5-inputs-input-outline"></div>
              {isMuted && (
                <div className="fcr-chatroom-h5-inputs-input-muted">
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

              <input
                onFocus={() => {
                  setInputFocus(true);
                }}
                onBlur={() => {
                  setInputFocus(false);
                }}
                disabled={isMuted}
                ref={inputRef}
                onSubmit={send}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                }}
                multiple={false}
                type={'text'}
                placeholder={isMuted ? '' : `${transI18n('chat.enter_contents')}...`}></input>
            </div>

            {!isMuted && (
              <div className="fcr-chatroom-h5-inputs-input-emoji">
                {showEmoji ? (
                  <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.KEYBOARD}
                    onClick={() => {
                      onShowEmojiChanged(false);
                      inputRef.current?.blur();
                      inputRef.current?.focus();
                    }}
                    size={34}></SvgImgMobile>
                ) : (
                  <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.CHAT_EMOJI}
                    onClick={() => {
                      onShowEmojiChanged(true);
                    }}
                    size={34}></SvgImgMobile>
                )}
              </div>
            )}
          </div>
          {text ? (
            <div className="fcr-chatroom-h5-inputs-send">
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
                <div className="fcr-chatroom-h5-inputs-hide-message" onClick={toggleMessageVisible}>
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
              {!isMuted && (
                <div className="fcr-chatroom-h5-inputs-image" onClick={handleImgInputClick}>
                  <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.CHAT_IMAGE}
                    size={30}></SvgImgMobile>
                </div>
              )}
              <input
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                type="file"
                style={{ display: 'none' }}></input>

              <Thumbsup></Thumbsup>
            </>
          )}
        </div>
        {showEmoji && emojiContainer && (
          <EmojiContainer portal={emojiContainer} onClick={handleEmojiClick}></EmojiContainer>
        )}
      </>
    );
  },
);
const EmojiContainer = ({
  onClick,
  portal,
}: {
  onClick: (emoji: string) => void;
  portal: HTMLDivElement;
}) => {
  return createPortal(
    <div
      className="fcr-chatroom-h5-input-emoji-container"
      style={{ zIndex: ComponentLevelRulesMobile.Level2 }}>
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
};
