import ImageViewer from '../image-viewer';
import { useI18n, Scheduler } from 'agora-common-libs';

import throttle from 'lodash/throttle';
import { observer } from 'mobx-react';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import {
  AgoraIMBase,
  AgoraIMCmdActionEnum,
  AgoraIMCustomMessage,
  AgoraIMImageMessage,
  AgoraIMMessageBase,
  AgoraIMMessageType,
  AgoraIMTextMessage,
} from '../../../../../../../../common/im/wrapper/typs';
import { useStore } from '../../../../hooks/useStore';
import './index.css';
export const MessageList = observer(() => {
  const {
    messageStore: {
      announcement,
      messageList,
      isBottom,
      setIsBottom,
      unreadMessageCount,
      addMessage,
      removeAnnouncementFromMessageList,
      setMessageListDom,
      messageListScrollToBottom,
    },
    roomStore: { isLandscape, messageVisible, forceLandscape },
    fcrChatRoom,
  } = useStore();
  const isAndroid = useMemo(() => /android/.test(navigator.userAgent.toLowerCase()), []);

  const transI18n = useI18n();
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback(
    throttle(() => {
      if (messageContainerRef.current)
        if (
          messageContainerRef.current.scrollTop + messageContainerRef.current.clientHeight <=
          messageContainerRef.current.scrollHeight - 2
        ) {
          setIsBottom(false);
        } else {
          setIsBottom(true);
        }
    }, 200),
    [],
  );
  useEffect(() => {
    if (isLandscape) {
      messageListScrollToBottom();
    }
  }, [isLandscape]);
  useEffect(() => {
    const lastMessage = messageList[messageList.length - 1];
    if (
      isBottom ||
      (lastMessage instanceof AgoraIMMessageBase &&
        lastMessage.from === fcrChatRoom.userInfo?.userId)
    ) {
      messageListScrollToBottom();
    }
  }, [isBottom, messageList.length, messageListScrollToBottom]);
  useEffect(() => {
    if (isLandscape && announcement) {
      addMessage(announcement);
    }
    if (!isLandscape) {
      removeAnnouncementFromMessageList();
    }
  }, [announcement, isLandscape]);
  useEffect(() => {
    const messageContainer = messageContainerRef.current;
    const resizeObserver = new ResizeObserver(handleScroll);
    if (messageContainer) {
      if (isAndroid) {
        messageContainer.onscroll = handleScroll;
      } else {
        messageContainer.addEventListener('scroll', handleScroll);
      }
      resizeObserver.observe(messageContainer);
      setMessageListDom(messageContainer);
    }
    return () => {
      if (messageContainerRef.current) {
        messageContainerRef.current.onscroll = null;
        messageContainerRef.current.removeEventListener('scroll', handleScroll);
      }
      resizeObserver.disconnect();
    };
  }, []);
  return (
    <>
      <div
        style={{
          visibility: messageVisible || !isLandscape ? 'visible' : 'hidden',
          WebkitMask: isLandscape
            ? '-webkit-gradient(linear,left 30,left top,from(#000),to(transparent))'
            : '',
          pointerEvents:
            messageList.length > 0 ? (isAndroid && forceLandscape ? 'none' : 'all') : 'none',
        }}
        className={`fcr-chatroom-mobile-messages${isLandscape ? '-landscape' : ''}`}
        ref={messageContainerRef}>
        {messageList.length > 0 ? (
          <div className="fcr-chatroom-mobile-messages-wrap">
            {messageList.map((message) => {
              if (typeof message === 'string') {
                return (
                  <AnnouncementMessage key={message} announcement={message}></AnnouncementMessage>
                );
              } else {
                switch (message.type) {
                  case AgoraIMMessageType.Text:
                    return <TextMessage key={message.id} message={message}></TextMessage>;
                  case AgoraIMMessageType.Image:
                    return (
                      <ImageMessage
                        onImgLoad={() => {
                          if (isBottom) {
                            messageListScrollToBottom();
                          }
                        }}
                        key={message.id}
                        message={message}></ImageMessage>
                    );
                  case AgoraIMMessageType.Custom:
                    return <CustomMessage key={message.id} message={message}></CustomMessage>;
                }
              }
            })}
          </div>
        ) : !isLandscape ? (
          <SvgImgMobile
            forceLandscape={forceLandscape}
            landscape={isLandscape}
            className="fcr-chatroom-mobile-message-placeholder"
            type={SvgIconEnum.MESSAGE_PLACEHOLDER}
            size={120}></SvgImgMobile>
        ) : null}
      </div>
      {unreadMessageCount !== 0 && messageVisible && (
        <div
          className={`fcr-chatroom-mobile-messages-has-new-container${
            isLandscape ? '-landscape' : ''
          }`}>
          <div onClick={messageListScrollToBottom} className="fcr-chatroom-mobile-messages-has-new">
            <span>
              {unreadMessageCount}&nbsp;
              {transI18n('fcr_h5_button_newmessage')}
            </span>
          </div>
        </div>
      )}
    </>
  );
});
const AnnouncementMessage = ({ announcement }: { announcement: string }) => {
  const transI18n = useI18n();
  return (
    <div
      key={announcement}
      className={`fcr-chatroom-mobile-message-item fcr-chatroom-mobile-message-announcement`}>
      <span className="fcr-chatroom-mobile-message-item-announcement-label">
        {transI18n('chat.announcement')}
      </span>
      {announcement}
    </div>
  );
};
const TextMessage = observer(({ message }: { message: AgoraIMMessageBase }) => {
  const {
    fcrChatRoom,
    roomStore: { isLandscape, forceLandscape },
  } = useStore();
  const { isTeacherMessage, messageFromAlias, messageStyleType } = useMessageParams({
    message,
    fcrChatRoom,
  });

  const textMessage = message as AgoraIMTextMessage;
  return (
    <div
      key={textMessage.id}
      className={`fcr-chatroom-mobile-message-item fcr-chatroom-mobile-message-item-${messageStyleType}`}>
      {isTeacherMessage && (
        <span className="fcr-chatroom-mobile-message-item-host">
          <SvgImgMobile
            forceLandscape={forceLandscape}
            landscape={isLandscape}
            type={SvgIconEnum.HOST}
            size={24}></SvgImgMobile>
        </span>
      )}

      <span className="fcr-chatroom-mobile-message-item-name">
        {textMessage.ext?.nickName}
        {messageFromAlias}:
      </span>
      {textMessage.msg}
    </div>
  );
});
const ImageMessage = observer(
  ({ message, onImgLoad }: { message: AgoraIMMessageBase; onImgLoad: () => void }) => {
    const {
      fcrChatRoom,
      roomStore: { isLandscape, forceLandscape },
    } = useStore();
    const { isTeacherMessage, messageFromAlias, messageStyleType } = useMessageParams({
      message,
      fcrChatRoom,
    });
    const imageMessage = message as AgoraIMImageMessage;
    const imageUrl =
      imageMessage.url || (imageMessage.file ? URL.createObjectURL(imageMessage.file) : '');
    useEffect(
      () => () => {
        URL.revokeObjectURL(imageUrl);
      },
      [],
    );
    const previewImage = () => {
      ImageViewer.show({ image: imageUrl });
      if (forceLandscape) {
        Scheduler.shared.addDelayTask(() => {
          const previewImage = document.querySelector(
            '.adm-image-viewer-image-wrapper img',
          ) as HTMLImageElement;
          if (previewImage) {
            previewImage.style.transform = 'rotate(90deg)';
          }
        }, 10);
      }
    };

    return (
      <>
        <div
          onClick={previewImage}
          key={imageMessage.id}
          className={`fcr-chatroom-mobile-message-item fcr-chatroom-mobile-message-item-img fcr-chatroom-mobile-message-item-${messageStyleType}`}>
          {isTeacherMessage && (
            <span className="fcr-chatroom-mobile-message-item-host">
              <SvgImgMobile
                forceLandscape={forceLandscape}
                landscape={isLandscape}
                type={SvgIconEnum.HOST}
                size={24}></SvgImgMobile>
            </span>
          )}

          <span className="fcr-chatroom-mobile-message-item-name">
            {imageMessage.ext?.nickName}
            {messageFromAlias}:
          </span>
          <img onLoad={onImgLoad} src={imageUrl}></img>
        </div>
      </>
    );
  },
);
const CustomMessage = observer(({ message }: { message: AgoraIMMessageBase }) => {
  const { fcrChatRoom } = useStore();

  const { messageFromAlias } = useMessageParams({
    message,
    fcrChatRoom,
  });
  const cmdMessage = message as AgoraIMCustomMessage;
  return (
    <div
      key={cmdMessage.id}
      className={`fcr-chatroom-mobile-message-item fcr-chatroom-mobile-message-item-student`}>
      <span className="fcr-chatroom-mobile-message-item-name">
        {cmdMessage.ext?.nickName}
        {messageFromAlias}&nbsp;
      </span>
      {convertCmdMessageAction(cmdMessage.action)}
    </div>
  );
});
const convertCmdMessageAction = (action: AgoraIMCmdActionEnum) => {
  const transI18n = useI18n();

  switch (action) {
    case AgoraIMCmdActionEnum.AllUserMuted:
      return transI18n('chat.muted_all');
    case AgoraIMCmdActionEnum.AllUserUnmuted:
      return transI18n('chat.unmuted_all');
    case AgoraIMCmdActionEnum.UserMuted:
      return transI18n('fcr_H5_mute_user_msg');

    case AgoraIMCmdActionEnum.UserUnmuted:
      return transI18n('fcr_H5_unmute_user_msg');
    case AgoraIMCmdActionEnum.MsgDeleted:
      return transI18n('chat.remove_message_notify');
  }
};
const useMessageParams = ({
  message,
  fcrChatRoom,
}: {
  message: AgoraIMMessageBase;
  fcrChatRoom: AgoraIMBase;
}) => {
  const transI18n = useI18n();

  const isSelfMessage = message.from === fcrChatRoom.userInfo?.userId;
  const isTeacherMessage = message.ext?.role === 1;
  const messageFromAlias = isSelfMessage
    ? `(${transI18n('chat.me')})`
    : isTeacherMessage
    ? `(${transI18n('chat.teacher')})`
    : '';
  const messageStyleType = isSelfMessage ? 'self' : isTeacherMessage ? 'teacher' : 'student';
  return {
    isSelfMessage,
    isTeacherMessage,
    messageFromAlias,
    messageStyleType,
  };
};
