import ImageViewer from '../image-viewer';
import { useI18n, Scheduler, transI18n } from 'agora-common-libs';

import throttle from 'lodash/throttle';
import { observer } from 'mobx-react';
import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
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
import { createPortal } from 'react-dom';
import classNames from 'classnames';
export const MessageList = observer(() => {
  const {
    messageStore: {
      messageList,
      isBottom,
      setIsBottom,
      unreadMessageCount,
      setMessageListDom,
      messageListScrollToBottom,
    },
    roomStore: { isLandscape, messageVisible, forceLandscape, landscapeToolBarVisible },
    fcrChatRoom,
  } = useStore();
  const scrollingRef = useRef(false);
  const scrollingTaskRef = useRef<Scheduler.Task | null>(null);
  const isAndroid = useMemo(() => /android/.test(navigator.userAgent.toLowerCase()), []);

  const messageContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(
    throttle(() => {
      scrollingTaskRef.current?.stop();
      scrollingTaskRef.current = Scheduler.shared.addDelayTask(() => {
        scrollingRef.current = false;
      }, 300);
      scrollingRef.current = true;
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
    console.log(isBottom, scrollingRef.current, 'scrollingRef.current');
    if (scrollingRef.current) {
      return;
    }
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
          visibility: (landscapeToolBarVisible && messageVisible) || !isLandscape ? 'visible' : 'hidden',
          WebkitMask: isLandscape
            ? '-webkit-gradient(linear,left 30,left top,from(#000),to(transparent))'
            : '',
          pointerEvents:
            messageList.length > 0 ? (isAndroid && forceLandscape ? 'none' : 'all') : 'none',
        }}
        className={`fcr-chatroom-mobile-messages${isLandscape ? '-landscape' : ''}`}
        ref={messageContainerRef}>
        {messageList.length > 0 ? (
          <div className={classNames("fcr-chatroom-mobile-messages-wrap", isLandscape && 'isLandscape')}>
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
        <UnreadMessage
          unreadMessageCount={unreadMessageCount}
          isLandscape={isLandscape}
          onClick={messageListScrollToBottom}></UnreadMessage>
      )}
    </>
  );
});
const UnreadMessage = ({
  isLandscape,
  onClick,
  unreadMessageCount,
}: {
  isLandscape: boolean;
  onClick: () => void;
  unreadMessageCount: number;
}) => {
  const transI18n = useI18n();
  const container = document.querySelector('.fcr-poll-mobile-widget');
  return container && !isLandscape ? (
    createPortal(
      <div
        className={`fcr-chatroom-mobile-messages-has-new-container${
          isLandscape ? '-landscape' : ''
        }`}>
        <div onClick={onClick} className="fcr-chatroom-mobile-messages-has-new">
          <span>
            {unreadMessageCount}&nbsp;
            {transI18n('fcr_h5_button_newmessage')}
          </span>
        </div>
      </div>,
      container,
    )
  ) : (
    <div
      className={`fcr-chatroom-mobile-messages-has-new-container${
        isLandscape ? '-landscape' : ''
      }`}>
      <div onClick={onClick} className="fcr-chatroom-mobile-messages-has-new">
        <span>
          {unreadMessageCount}&nbsp;
          {transI18n('fcr_h5_button_newmessage')}
        </span>
      </div>
    </div>
  );
};
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
    messageStore: { checkIsPrivateMessage },
    roomStore: { isLandscape, forceLandscape },
  } = useStore();
  const { isTeacherMessage, messageFromAlias, messageStyleType } = useMessageParams({
    message,
    fcrChatRoom,
  });
  const isSelfMessage = message?.from === fcrChatRoom.userInfo?.userId;
  const textMessage = message as AgoraIMTextMessage;
  return (
    <div
      key={textMessage.id}
      className={`fcr-chatroom-mobile-message-item fcr-chatroom-mobile-message-item-${messageStyleType}`}>
      {isTeacherMessage && (
        <span className={`fcr-chatroom-mobile-message-item-host ${!isLandscape ? '' : 'active'}`}>
          <SvgImgMobile
            colors={{ iconPrimary: isLandscape ? 'black' : 'white'}}
            forceLandscape={forceLandscape}
            landscape={isLandscape}
            type={SvgIconEnum.HOST}
            size={24}></SvgImgMobile>
        </span>
      )}
      {checkIsPrivateMessage(message) && isLandscape && (
        <span className="fcr-chatroom-mobile-message-item-private">
          <SvgImgMobile
            forceLandscape={forceLandscape}
            landscape={isLandscape}
            type={SvgIconEnum.PRIVATE}
            size={16}></SvgImgMobile>
        </span>
      )}
      {!checkIsPrivateMessage(message) && <span className="fcr-chatroom-mobile-message-item-name">
        {textMessage.ext?.nickName}
        {messageFromAlias}:
      </span>}
      {isSelfMessage && checkIsPrivateMessage(message) && (
        <span className="fcr-chat-private-tag">
          <span className="fcr-text-blue">{transI18n('fcr_chat_label_i')}</span>
          {transI18n('fcr_chat_label_i_said_to')}
          <span className="fcr-text-blue">{message.ext?.receiverList?.[0].nickName}</span>
          <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
          <span className='fcr-text-split'>:</span>
        </span>
      )}
      {!isSelfMessage && checkIsPrivateMessage(message) && (
        <span className="fcr-chat-private-tag">
          <span className="fcr-text-blue">{message.ext?.nickName}</span>
          {transI18n('fcr_chat_label_said_to_me')}
          <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
          <span className='fcr-text-split'>:</span>
        </span>
      )}
      {textMessage.msg}
    </div>
  );
});
const ImageMessage = observer(
  ({ message, onImgLoad }: { message: AgoraIMMessageBase; onImgLoad: () => void }) => {
    const {
      fcrChatRoom,
      messageStore: { checkIsPrivateMessage },
      roomStore: { isLandscape, forceLandscape },
    } = useStore();
    const { isTeacherMessage, messageFromAlias, messageStyleType } = useMessageParams({
      message,
      fcrChatRoom,
    });
    const isSelfMessage = message?.from === fcrChatRoom.userInfo?.userId;
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
                colors={{ iconPrimary: 'black' }}
                size={24}></SvgImgMobile>
            </span>
          )}
          {checkIsPrivateMessage(message) && isLandscape  && (
            <span className="fcr-chatroom-mobile-message-item-private">
              <SvgImgMobile
                forceLandscape={forceLandscape}
                landscape={isLandscape}
                type={SvgIconEnum.PRIVATE}
                size={16}></SvgImgMobile>
            </span>
          )}
          {!checkIsPrivateMessage(message) && <span className="fcr-chatroom-mobile-message-item-name">
            {imageMessage.ext?.nickName}
            {messageFromAlias}:
          </span>}
          {isSelfMessage && checkIsPrivateMessage(message) && (
            <span className="fcr-chat-private-tag">
              <span className="fcr-text-blue">{transI18n('fcr_chat_label_i')}</span>
              {transI18n('fcr_chat_label_i_said_to')}
              <span className="fcr-text-blue">{message.ext?.receiverList?.[0].nickName}</span>
              <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
              <span className='fcr-text-split'>:</span>
            </span>
          )}
          {!isSelfMessage && checkIsPrivateMessage(message) && (
            <span className="fcr-chat-private-tag">
              <span className="fcr-text-blue">{message.ext?.nickName}</span>
              {transI18n('fcr_chat_label_said_to_me')}
              <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
              <span className='fcr-text-split'>:</span>
            </span>
          )}
          <img onLoad={onImgLoad} src={imageUrl}></img>
        </div>
      </>
    );
  },
);
const CustomMessage = observer(({ message }: { message: AgoraIMMessageBase }) => {
  const { fcrChatRoom, messageStore: { checkIsPrivateMessage }, roomStore: { isLandscape }} = useStore();

  const { messageFromAlias } = useMessageParams({
    message,
    fcrChatRoom,
  });
  const isSelfMessage = message?.from === fcrChatRoom.userInfo?.userId;
  const cmdMessage = message as AgoraIMCustomMessage;
  return (
    <div
      key={cmdMessage.id}
      className={`fcr-chatroom-mobile-message-item fcr-chatroom-mobile-message-item-student`}>
        {!checkIsPrivateMessage(message) && <span className="fcr-chatroom-mobile-message-item-name">
            {cmdMessage.ext?.nickName}
            {messageFromAlias}:
        </span>}
        {isSelfMessage && checkIsPrivateMessage(message) && (
          <span className="fcr-chat-private-tag">
            <span className="fcr-text-blue">{transI18n('fcr_chat_label_i')}</span>
            {transI18n('fcr_chat_label_i_said_to')}
            <span className="fcr-text-blue">{message.ext?.receiverList?.[0].nickName}</span>
            <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
            <span className='fcr-text-split'>:</span>
          </span>
        )}
        {!isSelfMessage && checkIsPrivateMessage(message) && (
          <span className="fcr-chat-private-tag">
            <span className="fcr-text-blue">{message.ext?.nickName}</span>
            {transI18n('fcr_chat_label_said_to_me')}
            <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
            <span className='fcr-text-split'>:</span>
          </span>
        )}
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
    ? `(${transI18n('fcr_chat_label_i')})`
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
