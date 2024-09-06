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
import { Avatar } from '@components/avatar';
import dayjs from 'dayjs';
import { getNameColor } from '@components/avatar/helper';
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
  console.log('MessageListMessageList', unreadMessageCount, messageVisible)
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
          // visibility: (landscapeToolBarVisible && messageVisible) || !isLandscape ? 'visible' : 'hidden',
          // WebkitMask: isLandscape
          //   ? '-webkit-gradient(linear,left 30,left top,from(#000),to(transparent))'
          //   : '',
          pointerEvents:
            messageList.length > 0 ? (isAndroid && forceLandscape ? 'none' : 'all') : 'none',
        }}
        className={`fcr-chatroom-mobile-messages${isLandscape ? '-landscape' : ''}`}
        ref={messageContainerRef}>
        {messageList.length > 0 ? (
          <div className={classNames("fcr-chatroom-mobile-messages-wrap", isLandscape && 'fcr-chatroom-mobile-messages-wrap-isLandscape')}>
            {messageList.map((message, index) => {
              const lastMsg = index > 0 ? messageList[index - 1] : { from: '' } as AgoraIMMessageBase;

              if (typeof message === 'string') {
                return (
                  <AnnouncementMessage key={message} announcement={message}></AnnouncementMessage>
                );
              } else {
                switch (message.type) {
                  case AgoraIMMessageType.Text:
                    return <TextMessage key={message.id} message={message} lastMsg={lastMsg as AgoraIMMessageBase}></TextMessage>;
                  case AgoraIMMessageType.Image:
                    return (
                      <ImageMessage
                        onImgLoad={() => {
                          if (isBottom) {
                            messageListScrollToBottom();
                          }
                        }}
                        key={message.id}
                        message={message}
                        lastMsg={lastMsg as AgoraIMMessageBase}
                      ></ImageMessage>
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
      {unreadMessageCount !== 0 && (isLandscape ? messageVisible : true) && (
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
        className={`fcr-chatroom-mobile-messages-has-new-container${isLandscape ? '-landscape' : ''}`}>
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
      className={`fcr-chatroom-mobile-messages-has-new-container${isLandscape ? '-landscape' : ''}`}>
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
  const {
    roomStore: {
      isLandscape,
      forceLandscape,
    },
  } = useStore();

  const transI18n = useI18n();
  return (
    <div className='fcr-chatroom-mobile-message-item-wrapped fcr-chatroom-mobile-message-announcement-wrapped'>
      <div
        key={announcement}
        className={`fcr-chatroom-mobile-message-item fcr-chatroom-mobile-message-announcement`}>
        <div className="fcr-chatroom-mobile-message-item-announcement-label">
          <SvgImgMobile
            forceLandscape={forceLandscape}
            landscape={isLandscape}
            type={SvgIconEnum.NOTICE}
            size={30}
          />
        </div>
        <div className='fcr-chatroom-mobile-message-item-notice-content'>{announcement}</div>
      </div>
    </div>
  );
};
const TextMessage = observer(({ message, lastMsg }: { message: AgoraIMMessageBase, lastMsg: AgoraIMMessageBase }) => {
  const {
    fcrChatRoom,
    messageStore: { checkIsPrivateMessage },
    roomStore: {
      isLandscape,
      forceLandscape,
      isBreakOutRoomEnabled,
      isBreakOutRoomIn },
    userStore: { privateUser, chatGroup }
  } = useStore();
  const { isTeacherMessage, messageFromAlias, messageStyleType } = useMessageParams({
    message,
    fcrChatRoom,
  });
  const isSelfMessage = message?.from === fcrChatRoom.userInfo?.userId;
  const textMessage = message as AgoraIMTextMessage;
  const isToTeacher = message.ext?.receiverList[0]?.ext?.role == 1;

//替换内容中的超链接
  const replaceContentToLink = (text: string | null):string => {
    const urlRegex = /((https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/g;
    return text ? text.replace(urlRegex, (match, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    }) : "";
  }
  const isHidden = lastMsg?.from == textMessage?.from && (
    (checkIsPrivateMessage(textMessage) && (lastMsg?.ext && lastMsg?.ext?.receiverList?.length > 0)) || (!checkIsPrivateMessage(textMessage) && (lastMsg?.ext && lastMsg?.ext?.receiverList?.length == 0)));


  return (
    <div
      className={`fcr-chatroom-mobile-message-item-wrapped fcr-chatroom-mobile-message-item-${messageStyleType}-wrapped`}
    >
      <div
        key={textMessage.id}
        className={`fcr-chatroom-mobile-message-item fcr-chatroom-mobile-message-item-${messageStyleType} ${isHidden ? 'fcr-chatroom-mobile-message-item-isHidden' : ''}`}
      >
        {!checkIsPrivateMessage(textMessage) && <div className="fcr-chatroom-mobile-message-item-list">
          {!isSelfMessage && !isHidden && <Avatar size={36} borderRadius={'50%'} textSize={16} style={{ backgroundColor: isTeacherMessage ? 'var(--head-4, #D2DB0E)' : getNameColor(textMessage.ext?.nickName || '') }} nickName={textMessage.ext?.nickName || ''}></Avatar>}
          <div className='fcr-chatroom-mobile-message-item-name-content'>
            {!isHidden && <div className='fcr-chatroom-mobile-message-item-name' >
              {isTeacherMessage && <SvgImgMobile
                forceLandscape={forceLandscape}
                landscape={isLandscape}
                type={SvgIconEnum.TEACHER_ICON}
                size={16}
              />}
              <span className='fcr-chatroom-mobile-message-item-nickname' style={{ color: isTeacherMessage ? 'var(--head-4, #D2DB0E)' : isSelfMessage ? 'var(--inverse-text-primary, #FEFEFE)' : getNameColor(textMessage.ext?.nickName || '') }}>
                {`${textMessage.ext?.nickName}${isTeacherMessage ? '(Turtor)' : ''}`}
              </span>
              {textMessage?.ts && (
                <div className="fcr-chat-message-list-item-time">
                  {dayjs(textMessage.ts).format(isSelfMessage ? 'MM-DD hh:mm A' : 'YYYY-MM-DD hh:mm A')}
                </div>
              )}
            </div>}
            <div className='fcr-chatroom-mobile-message-content'dangerouslySetInnerHTML={{ __html: replaceContentToLink(textMessage.msg) }}></div>
          </div>
          {/* {messageFromAlias}: */}
        </div>}
        {isSelfMessage && checkIsPrivateMessage(textMessage) && (
          <div className="fcr-chatroom-mobile-message-item-name-content">
            {!isHidden && <div className='fcr-chatroom-mobile-message-item-name'>
              <span className="fcr-chat-private-tag fcr-chat-private-tag-right">
                <span >{transI18n('fcr_chat_label_i')}</span>
                <span className='fcr-text-send-to'>{transI18n('fcr_chat_label_i_said_to')}</span>
                <span className='fcr-chatroom-mobile-message-item-nickname' >{`${textMessage.ext?.receiverList?.[0].nickName}${isToTeacher ? '(Turtor)' : ''}`}</span>
                <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
              </span>
              {textMessage?.ts && (
                <div className="fcr-chat-message-list-item-time">
                  {dayjs(textMessage.ts).format(isSelfMessage ? 'MM-DD hh:mm A' : 'YYYY-MM-DD hh:mm A')}
                </div>
              )}
            </div>}
            <div className='fcr-chatroom-mobile-message-content'dangerouslySetInnerHTML={{ __html: replaceContentToLink(textMessage.msg) }}></div>
          </div>
        )}
        {!isSelfMessage && checkIsPrivateMessage(textMessage) && (
          <div className="fcr-chatroom-mobile-message-item-list">
            {!isHidden && <Avatar size={36} borderRadius={'50%'} textSize={16} style={{ backgroundColor: isTeacherMessage ? 'var(--head-4, #D2DB0E)' : getNameColor(textMessage.ext?.nickName || '') }} nickName={textMessage.ext?.nickName || ''}></Avatar>}
            <div className='fcr-chatroom-mobile-message-item-name-content'>
              {!isHidden && <div className='fcr-chatroom-mobile-message-item-name'>
                {isTeacherMessage && <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.TEACHER_ICON}
                  size={16}
                />}
                <span className="fcr-chat-private-tag">
                  <span className='fcr-chatroom-mobile-message-item-nickname' style={{ color: isTeacherMessage ? 'var(--head-4, #D2DB0E)' : getNameColor(textMessage.ext?.nickName || '') }} >{`${message.ext?.nickName}${isTeacherMessage ? '(Turtor)' : ''}`} </span>
                  <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
                </span>
                {textMessage?.ts && (
                  <div className="fcr-chat-message-list-item-time">
                    {dayjs(textMessage.ts).format(isSelfMessage ? 'MM-DD hh:mm A' : 'YYYY-MM-DD hh:mm A')}
                  </div>
                )}
              </div>}
              <div className='fcr-chatroom-mobile-message-content'dangerouslySetInnerHTML={{ __html: replaceContentToLink(textMessage.msg) }}></div>
            </div>
          </div>
        )}
      </div>
    </div>

  );
});
const ImageMessage = observer(
  ({ message, onImgLoad, lastMsg }: { message: AgoraIMMessageBase; onImgLoad: () => void, lastMsg: AgoraIMMessageBase }) => {
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
    const isToTeacher = message.ext?.receiverList[0]?.ext?.role == 1;
    const imageMessage = message as AgoraIMImageMessage;

    const isHidden = lastMsg?.from == imageMessage?.from && (
      (checkIsPrivateMessage(imageMessage) && (lastMsg?.ext && lastMsg?.ext?.receiverList?.length > 0)) || (!checkIsPrivateMessage(imageMessage) && (lastMsg?.ext && lastMsg?.ext?.receiverList?.length == 0)));

    const imageUrl =
      imageMessage.url || (imageMessage.file ? URL.createObjectURL(imageMessage.file) : '');
    useEffect(() => () => {
      URL.revokeObjectURL(imageUrl);
    }, []);

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
      <div
        className={`fcr-chatroom-mobile-message-item-wrapped fcr-chatroom-mobile-message-item-img-wrapped fcr-chatroom-mobile-message-item-${messageStyleType}-wrapped`}
      >
        <div
          className={`fcr-chatroom-mobile-message-item fcr-chatroom-mobile-message-item-img fcr-chatroom-mobile-message-item-${messageStyleType} ${isHidden ? 'fcr-chatroom-mobile-message-item-isHidden' : ''}`}>
          {!checkIsPrivateMessage(imageMessage) && <span className="fcr-chatroom-mobile-message-item-list">
            {!isSelfMessage && !isHidden && <Avatar size={36} borderRadius={'50%'} textSize={16} style={{ backgroundColor: isTeacherMessage ? 'var(--head-4, #D2DB0E)' : getNameColor(imageMessage.ext?.nickName || '') }} nickName={imageMessage.ext?.nickName || ''}></Avatar>}
            <div className='fcr-chatroom-mobile-message-item-name-content'>
              {!isHidden && <div className='fcr-chatroom-mobile-message-item-name'>
                {isTeacherMessage && <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.TEACHER_ICON}
                  size={16}
                />}
                <span className='fcr-chatroom-mobile-message-item-nickname' style={{ color: isTeacherMessage ? 'var(--head-4, #D2DB0E)' : isSelfMessage ? 'var(--inverse-text-primary, #FEFEFE)' : getNameColor(imageMessage.ext?.nickName || '') }}>{`${imageMessage.ext?.nickName}${isTeacherMessage ? '(Turtor)' : ''}`}</span>
                {imageMessage?.ts && (
                  <div className="fcr-chat-message-list-item-time">
                    {dayjs(imageMessage.ts).format(isSelfMessage ? 'MM-DD hh:mm A' : 'YYYY-MM-DD hh:mm A')}
                  </div>
                )}
              </div>}
              <div
                className='fcr-chatroom-mobile-message-content-image'
                onClick={previewImage}
                key={imageMessage.id}
              >
                <img onLoad={onImgLoad} src={imageUrl}></img>
              </div>
            </div>
          </span>}
          {isSelfMessage && checkIsPrivateMessage(imageMessage) && (
            <div className="fcr-chatroom-mobile-message-item-list">
              <div className='fcr-chatroom-mobile-message-item-name-content'>
                {!isHidden && <div className='fcr-chatroom-mobile-message-item-name'>
                  <span className="fcr-chat-private-tag">
                    <span >{transI18n('fcr_chat_label_i')}</span>
                    <div className='fcr-text-send-to' style={{ display: 'inline-block' }}>{transI18n('fcr_chat_label_i_said_to')}</div>
                    <span className='fcr-chatroom-mobile-message-item-nickname'>{`${imageMessage.ext?.receiverList?.[0].nickName}${isToTeacher ? '(Turtor)' : ''}`}</span>
                    <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
                  </span>
                  {imageMessage?.ts && (
                    <div className="fcr-chat-message-list-item-time">
                      {dayjs(imageMessage.ts).format(isSelfMessage ? 'MM-DD hh:mm A' : 'YYYY-MM-DD hh:mm A')}
                    </div>
                  )}
                </div>}
                <div
                  className='fcr-chatroom-mobile-message-content-image'
                  onClick={previewImage}
                  key={imageMessage.id}
                >
                  <img onLoad={onImgLoad} src={imageUrl}></img>
                </div>
              </div>
            </div>
          )}
          {!isSelfMessage && checkIsPrivateMessage(imageMessage) && (
            <div className="fcr-chatroom-mobile-message-item-list">
              {!isHidden && <Avatar size={36} borderRadius={'50%'} textSize={16} style={{ backgroundColor: isTeacherMessage ? 'var(--head-4, #D2DB0E)' : getNameColor(imageMessage.ext?.nickName || '') }} nickName={imageMessage.ext?.nickName || ''}></Avatar>}
              <div className='fcr-chatroom-mobile-message-item-name-content'>
                {!isHidden && <div className='fcr-chatroom-mobile-message-item-name'>
                  {isTeacherMessage && <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.TEACHER_ICON}
                    size={16}
                  />}
                  <span className="fcr-chat-private-tag">
                    <span className='fcr-chatroom-mobile-message-item-nickname' style={{ color: isTeacherMessage ? 'var(--head-4, #D2DB0E)' : getNameColor(imageMessage.ext?.nickName || '') }}>{`${imageMessage.ext?.nickName}${isTeacherMessage ? '(Turtor)' : ''}`} </span>
                    <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
                  </span>
                  {imageMessage?.ts && (
                    <div className="fcr-chat-message-list-item-time">
                      {dayjs(imageMessage.ts).format(isSelfMessage ? 'MM-DD hh:mm A' : 'YYYY-MM-DD hh:mm A')}
                    </div>
                  )}
                </div>}
                <div
                  onClick={previewImage}
                  key={imageMessage.id}
                  className='fcr-chatroom-mobile-message-content-image'
                >
                  <img onLoad={onImgLoad} src={imageUrl}></img>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);
const CustomMessage = observer(({ message }: { message: AgoraIMMessageBase }) => {
  const { fcrChatRoom, messageStore: { checkIsPrivateMessage }, roomStore: { isLandscape, forceLandscape } } = useStore();

  const { isTeacherMessage, messageFromAlias } = useMessageParams({
    message,
    fcrChatRoom,
  });
  const isSelfMessage = message?.from === fcrChatRoom.userInfo?.userId;
  const isToTeacher = message.ext?.receiverList[0]?.ext?.role == 1;
  const cmdMessage = message as AgoraIMCustomMessage;

  return (
    <div
      key={cmdMessage.id}
      className={`fcr-chatroom-mobile-message-item fcr-chatroom-mobile-message-item-student`}>
      {/* {isSelfMessage && checkIsPrivateMessage(cmdMessage) && (
        <div className='fcr-chatroom-mobile-message-item-name'>
          <span className="fcr-chat-private-tag">
            <span >{transI18n('fcr_chat_label_i')}</span>
            <div className='fcr-text-send-to'>{transI18n('fcr_chat_label_i_said_to')}</div>
            <span >{`${cmdMessage.ext?.receiverList?.[0].nickName}${isToTeacher ? '(Turtor)' : ''}`}</span>
            <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
          </span>
          {cmdMessage?.ts && (
            <div className="fcr-chat-message-list-item-time">
              {dayjs(cmdMessage.ts).format(isSelfMessage ? 'MM-DD hh:mm A' : 'YYYY-MM-DD hh:mm A')}
            </div>
          )}
        </div>
      )}
      {!isSelfMessage && checkIsPrivateMessage(cmdMessage) && (
        <div className='fcr-chatroom-mobile-message-item-name'>
          <span className="fcr-chat-private-tag">
            {isTeacherMessage && <SvgImgMobile
              forceLandscape={forceLandscape}
              landscape={isLandscape}
              type={SvgIconEnum.TEACHER_ICON}
              size={16}
            />}
            <span style={{ color: isTeacherMessage ? 'var(--head-4, #D2DB0E)' : getNameColor(cmdMessage.ext?.nickName || '') }}>{`${cmdMessage.ext?.nickName}${isTeacherMessage ? '(Turtor)' : ''}`}</span>
            <span className="fcr-text-yellow">({transI18n('fcr_chat_label_private')})</span>
          </span>
        </div>
      )} */}
      <div className='fcr-chatroom-mobile-message-item-student-text'>{convertCmdMessageAction(cmdMessage.action)}</div>
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
