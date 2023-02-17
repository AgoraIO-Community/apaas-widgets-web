import { useI18n, transI18n } from 'agora-common-libs';
import { EduRoleTypeEnum } from 'agora-edu-core';
import { throttle } from 'lodash';
import { observer } from 'mobx-react';
import { useEffect, useRef, useCallback } from 'react';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../components/svg-img';
import {
  AgoraIMBase,
  AgoraIMCmdActionEnum,
  AgoraIMCustomMessage,
  AgoraIMImageMessage,
  AgoraIMMessageBase,
  AgoraIMMessageType,
  AgoraIMTextMessage,
} from '../../../../../../im/wrapper/typs';
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
      if (/(?:Android)/.test(navigator.userAgent)) {
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
        style={{ visibility: messageVisible || !isLandscape ? 'visible' : 'hidden' }}
        className={`fcr-chatroom-h5-messages${isLandscape ? '-landscape' : ''}`}
        ref={messageContainerRef}>
        {messageList.length > 0 ? (
          <div className="fcr-chatroom-h5-messages-wrap">
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
            className="fcr-chatroom-h5-message-placeholder"
            type={SvgIconEnum.MESSAGE_PLACEHOLDER}
            size={120}></SvgImgMobile>
        ) : null}
      </div>
      {unreadMessageCount !== 0 && messageVisible && (
        <div
          className={`fcr-chatroom-h5-messages-has-new-container${
            isLandscape ? '-landscape' : ''
          }`}>
          <div onClick={messageListScrollToBottom} className="fcr-chatroom-h5-messages-has-new">
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
  return (
    <div
      key={announcement}
      className={`fcr-chatroom-h5-message-item fcr-chatroom-h5-message-announcement`}>
      <span className="fcr-chatroom-h5-message-item-announcement-label">
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
      className={`fcr-chatroom-h5-message-item fcr-chatroom-h5-message-item-${messageStyleType}`}>
      {isTeacherMessage && (
        <span className="fcr-chatroom-h5-message-item-host">
          <SvgImgMobile
            forceLandscape={forceLandscape}
            landscape={isLandscape}
            type={SvgIconEnum.HOST}
            size={24}></SvgImgMobile>
        </span>
      )}

      <span className="fcr-chatroom-h5-message-item-name">
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
    return (
      <div
        key={imageMessage.id}
        className={`fcr-chatroom-h5-message-item fcr-chatroom-h5-message-item-img fcr-chatroom-h5-message-item-${messageStyleType}`}>
        {isTeacherMessage && (
          <span className="fcr-chatroom-h5-message-item-host">
            <SvgImgMobile
              forceLandscape={forceLandscape}
              landscape={isLandscape}
              type={SvgIconEnum.HOST}
              size={24}></SvgImgMobile>
          </span>
        )}

        <span className="fcr-chatroom-h5-message-item-name">
          {imageMessage.ext?.nickName}
          {messageFromAlias}:
        </span>
        <img onLoad={onImgLoad} src={imageUrl}></img>
      </div>
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
      className={`fcr-chatroom-h5-message-item fcr-chatroom-h5-message-item-student`}>
      <span className="fcr-chatroom-h5-message-item-name">
        {cmdMessage.ext?.nickName}
        {messageFromAlias}&nbsp;
      </span>
      {convertCmdMessageAction(cmdMessage.action)}
    </div>
  );
});
const convertCmdMessageAction = (action: AgoraIMCmdActionEnum) => {
  switch (action) {
    case AgoraIMCmdActionEnum.AllUserMuted:
      return transI18n('chat.muted_all');
    case AgoraIMCmdActionEnum.AllUserUnmuted:
      return transI18n('chat.unmuted_all');
    case AgoraIMCmdActionEnum.UserMuted:
      return transI18n('fcr_H5_mute_user_msg');

    case AgoraIMCmdActionEnum.UserUnmuted:
      return transI18n('fcr_H5_unmute_user_msg');
  }
};
const useMessageParams = ({
  message,
  fcrChatRoom,
}: {
  message: AgoraIMMessageBase;
  fcrChatRoom: AgoraIMBase;
}) => {
  const isSelfMessage = message.from === fcrChatRoom.userInfo?.userId;
  const isTeacherMessage = message.ext?.role === EduRoleTypeEnum.teacher;
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
