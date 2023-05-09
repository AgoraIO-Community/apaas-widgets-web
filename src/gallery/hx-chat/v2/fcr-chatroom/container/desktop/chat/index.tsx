import './index.css';
import { Input } from '@components/input';
import { TextArea } from '@components/textarea';
import { Button } from '@components/button';

import { Switch } from '@components/switch';
import { observer } from 'mobx-react';
import { useContext, useEffect, useState } from 'react';
import { useStore } from '../../../hooks/useStore';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import classnames from 'classnames';

import {
  AgoraIMCmdActionEnum,
  AgoraIMCustomMessage,
  AgoraIMMessageBase,
  AgoraIMMessageType,
  AgoraIMTextMessage,
} from '../../../../../../im/wrapper/typs';
import { useI18n } from 'agora-common-libs/lib/i18n';
import { ToolTip } from '@components/tooltip';
import { useScroll } from '../../../hooks/useScroll';
import { EduRoleTypeEnum } from 'agora-edu-core';
import { Avatar } from '@components/avatar';
import { useMute } from '../../../hooks/useMute';
import { ToastApi } from '@components/toast';
import { FcrChatroomToastContext } from '..';
export const FcrChatContainer = observer(() => {
  const {
    messageStore: { showAnnouncementInput },
    roomStore: { allMuted, isHost },
    userStore: { userMuted },
  } = useStore();
  const isMuted = (allMuted || userMuted) && !isHost;
  return (
    <div className="fcr-chat-container">
      <Messages></Messages>
      {showAnnouncementInput ? (
        <AnnouncementInput></AnnouncementInput>
      ) : isMuted ? (
        <MutedInput></MutedInput>
      ) : (
        <ChatInput></ChatInput>
      )}
    </div>
  );
});
const ChatInput = observer(() => {
  const [inputFocus, setInputFocus] = useState(false);

  const {
    messageStore: { messageInputText, setMessageInputText, sendTextMessage, sendCustomMessage },
    roomStore: { allMuted, setAllMute, isHost },
  } = useStore();
  const sendDisabled = !messageInputText;
  const send = () => {
    if (sendDisabled) return;
    sendTextMessage(messageInputText);
    setMessageInputText('');
  };
  const handleAllMute = async (mute: boolean) => {
    await setAllMute(mute);
    sendCustomMessage(
      mute ? AgoraIMCmdActionEnum.AllUserMuted : AgoraIMCmdActionEnum.AllUserUnmuted,
    );
  };
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.keyCode === 13 && !e.ctrlKey) {
      e.preventDefault();
      send();
    } else if (e.keyCode === 13 && e.ctrlKey) {
      setMessageInputText(messageInputText + '\n');
    }
  };
  return (
    <div className="fcr-chat-input-container">
      <div className="fcr-chat-input-wrap">
        <div className="fcr-chat-input-actions">
          <div className="fcr-chat-input-actions-label">
            <AnnouncementTrigger></AnnouncementTrigger>
          </div>
          {isHost && (
            <div className="fcr-chat-input-actions-mute-all">
              <span>All Chat Muted</span>
              <Switch onChange={handleAllMute} value={allMuted}></Switch>
            </div>
          )}
        </div>
        <div className={classnames('fcr-chat-input', { 'fcr-chat-input-focus': inputFocus })}>
          <SvgImg
            className={classnames('fcr-chat-input-send', {
              'fcr-chat-input-send-disabled': sendDisabled,
            })}
            onClick={send}
            type={SvgIconEnum.FCR_SEND}
            size={32}></SvgImg>
          <TextArea
            onKeyDown={handleKeyDown}
            autoSize
            maxCount={150}
            onFocusChange={setInputFocus}
            resizable={false}
            showCount={false}
            placeholder="Enter a message..."
            value={messageInputText}
            onChange={setMessageInputText}></TextArea>
        </div>
      </div>
    </div>
  );
});
const MutedInput = observer(() => {
  const {
    userStore: { userMuted },
    roomStore: { allMuted },
  } = useStore();
  const muteText = allMuted ? 'All muted' : userMuted ? 'You are muted by teacher' : '';
  return (
    <div className="fcr-chat-muted-input-container">
      <ToolTip placement="top" content={"Muted, can't send messages"}>
        <div className="fcr-chat-muted-input">
          <AnnouncementTrigger></AnnouncementTrigger>
          <div className="fcr-chat-muted-input-text">
            <SvgImg type={SvgIconEnum.FCR_CHAT} size={30}></SvgImg>
            {muteText}
          </div>
        </div>
      </ToolTip>
    </div>
  );
});
const AnnouncementTrigger = observer(() => {
  const {
    messageStore: { showAnnouncement, setShowAnnouncement, setShowAnnouncementInput, announcement },
    roomStore: { isHost },
  } = useStore();
  return (
    <div
      onClick={() => {
        if (isHost && !announcement) {
          setShowAnnouncementInput(true);
          return;
        }
        if (!showAnnouncement && announcement) {
          setShowAnnouncement(true);
        }
      }}
      className={classnames('fcr-chat-input-actions-item', {
        'fcr-chat-input-actions-item-active': showAnnouncement,
      })}>
      <SvgImg type={SvgIconEnum.FCR_NOTICE} size={24}></SvgImg>
    </div>
  );
});
const AnnouncementInput = observer(() => {
  const {
    messageStore: {
      announcementInputText,
      setAnnouncementInputText,
      setShowAnnouncementInput,
      updateAnnouncement,
    },
  } = useStore();
  const toast = useContext(FcrChatroomToastContext);

  return (
    <div className="fcr-chat-announcement-input-wrap">
      <div className="fcr-chat-announcement-input">
        <div className="fcr-chat-announcement-input-title">
          Announcement
          <div className="fcr-chat-announcement-close">
            <SvgImg
              onClick={() => setShowAnnouncementInput(false)}
              type={SvgIconEnum.FCR_CLOSE}
              size={12}></SvgImg>
          </div>
        </div>
        <div className="fcr-chat-announcement-input-textarea">
          <TextArea
            value={announcementInputText}
            onChange={setAnnouncementInputText}
            maxCount={150}
            placeholder={'Enter ...'}
            resizable={false}></TextArea>
        </div>
      </div>
      <div className="fcr-chat-announcement-submit">
        <Button size="XS" styleType="gray" onClick={() => setShowAnnouncementInput(false)}>
          Cancel
        </Button>
        <Button
          size="XS"
          onClick={async () => {
            await updateAnnouncement(announcementInputText);
            toast?.open({
              toastProps: {
                content: 'Announcement submit successfully',
                type: 'normal',
              },
            });
            setShowAnnouncementInput(false);
          }}>
          Submit
        </Button>
      </div>
    </div>
  );
});
const Messages = observer(() => {
  return (
    <div className="fcr-chat-message-container">
      <UnreadMessageLabel></UnreadMessageLabel>
      <AnnounceMent></AnnounceMent>
      <MessageList></MessageList>
    </div>
  );
});
const UnreadMessageLabel = observer(() => {
  const {
    messageStore: { unreadMessageCount, messageListScrollToBottom },
  } = useStore();
  return unreadMessageCount > 0 ? (
    <div onClick={messageListScrollToBottom} className="fcr-chat-message-unread-message">
      {unreadMessageCount} new message(s)
    </div>
  ) : null;
});
const MessageList = observer(() => {
  const {
    messageStore: { renderableMessageList },
  } = useStore();
  const { messageContainerRef } = useScroll();
  return (
    <div ref={messageContainerRef} className="fcr-chat-message-list fcr-scrollbar-override">
      {renderableMessageList.length === 0 && (
        <div className="fcr-chat-message-list-placeholder">
          <SvgImg type={SvgIconEnum.FCR_CHAT_PLACEHOLDER} size={200}></SvgImg>
          <span>No Message</span>
        </div>
      )}
      {renderableMessageList.map((messages) => {
        if (messages instanceof Array) {
          const lastMessage = messages[messages.length - 1];
          return <MessageListItem key={lastMessage.id} messages={messages}></MessageListItem>;
        } else {
          const message = messages;
          return (
            <CmdMessageItem
              key={message.id}
              message={messages as AgoraIMCustomMessage}></CmdMessageItem>
          );
        }
      })}
    </div>
  );
});
const CmdMessageItem = observer(({ message }: { message: AgoraIMCustomMessage }) => {
  const { fcrChatRoom } = useStore();
  const selfUserId = fcrChatRoom.userInfo?.userId;
  const isSelfAction = message.from === fcrChatRoom.userInfo?.userId;
  const msgNickName = isSelfAction
    ? `${fcrChatRoom.userInfo?.nickName}(you)`
    : `${message.ext?.nickName}`;
  const convertCmdMessageAction = (action: AgoraIMCmdActionEnum) => {
    const transI18n = useI18n();

    switch (action) {
      case AgoraIMCmdActionEnum.AllUserMuted:
        return 'The teacher mute all';
      case AgoraIMCmdActionEnum.AllUserUnmuted:
        return 'The teacher unmute all';
      case AgoraIMCmdActionEnum.UserMuted:
        if (isSelfAction) {
          return (
            <>
              <span>{message.ext?.muteNickName}</span>
              was mute by you
            </>
          );
        }
        if (message.ext?.muteMember === selfUserId) {
          return (
            <>
              <span>{message.ext?.muteNickName} (you)</span>
              was mute by teacher
            </>
          );
        } else {
          return (
            <>
              <span>{message.ext?.muteNickName}</span>
              was mute by teacher
            </>
          );
        }

      case AgoraIMCmdActionEnum.UserUnmuted:
        if (isSelfAction) {
          return (
            <>
              <span>{message.ext?.muteNickName}</span>
              was unmute by you
            </>
          );
        }
        if (message.ext?.muteMember === selfUserId) {
          return (
            <>
              <span>{message.ext?.muteNickName} (you)</span>
              was unmute by teacher
            </>
          );
        } else {
          return (
            <>
              <span>{message.ext?.muteNickName}</span>
              was unmute by teacher
            </>
          );
        }
      case AgoraIMCmdActionEnum.MsgDeleted:
        return transI18n('chat.remove_message_notify');
    }
  };
  return (
    <div className="fcr-chat-message-list-item-custom">
      {convertCmdMessageAction(message.action)}
    </div>
  );
});
const MessageListItem = observer(({ messages }: { messages: AgoraIMMessageBase[] }) => {
  const {
    fcrChatRoom,
    roomStore: { isHost },
    userStore: { muteList, userList },
  } = useStore();
  const { muteUser, unmuteUser } = useMute();
  const lastMessage = messages[messages.length - 1];

  const isSelfMessage = lastMessage.from === fcrChatRoom.userInfo?.userId;
  const isMessageFromHost = lastMessage.ext?.role === EduRoleTypeEnum.teacher;
  const renderPlacement = isSelfMessage ? 'right' : 'left';
  const showAvatarAndHost = renderPlacement === 'left';
  const [actionVisible, setActionVisible] = useState(false);
  const isUserMuted = muteList.includes(lastMessage.from || '');
  const currUser = userList.find((user) => user.userId === lastMessage.from);
  const toggleAction = () => {
    setActionVisible(!actionVisible);
  };
  useEffect(() => {
    setTimeout(() => {
      if (actionVisible) {
        document.addEventListener('click', toggleAction);
      } else {
        document.removeEventListener('click', toggleAction);
      }
    });

    return () => document.removeEventListener('click', toggleAction);
  }, [actionVisible]);
  return (
    <div
      className={classnames(
        'fcr-chat-message-list-item',
        `fcr-chat-message-list-item-placement-${renderPlacement}`,
        { 'fcr-chat-message-list-item-placement-host': isMessageFromHost },
      )}>
      {showAvatarAndHost && (
        <div className="fcr-chat-message-list-item-left">
          <div className="fcr-chat-message-list-item-avatar-container" onClick={toggleAction}>
            <Avatar size={28} textSize={12} nickName={lastMessage?.ext?.nickName || ''}></Avatar>
            {isUserMuted && (
              <div className="fcr-chat-message-list-item-mute-icon">
                <SvgImg type={SvgIconEnum.FCR_SETTING_NONE}></SvgImg>
              </div>
            )}
            {isHost && (
              <>
                <div
                  className={classnames('fcr-chat-message-list-item-avatar-action', {
                    'fcr-chat-message-list-item-avatar-action-visible': actionVisible,
                  })}>
                  <div>
                    {isUserMuted ? (
                      <Button
                        styleType="danger"
                        size="XXS"
                        onClick={() => {
                          if (currUser) unmuteUser(currUser);
                        }}>
                        Unmute
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          if (currUser) muteUser(currUser);
                        }}
                        size="XXS">
                        Mute
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="fcr-chat-message-list-item-right">
        <div className="fcr-chat-message-list-item-extra">
          {isMessageFromHost && showAvatarAndHost && (
            <div className="fcr-chat-message-list-item-host">Host</div>
          )}

          <div className="fcr-chat-message-list-item-name">{lastMessage.ext?.nickName}</div>
        </div>
        {messages.map((message) => {
          switch (message.type) {
            case AgoraIMMessageType.Text:
              const textMessage = message as AgoraIMTextMessage;
              return (
                <div
                  key={textMessage.id}
                  className="fcr-chat-message-list-item-content"
                  dangerouslySetInnerHTML={{ __html: textMessage.msg }}></div>
              );
          }
        })}
      </div>
    </div>
  );
});
const AnnounceMent = observer(() => {
  const {
    messageStore: { showAnnouncement, announcement, setShowAnnouncement, setShowAnnouncementInput },
    roomStore: { isHost },
  } = useStore();
  const hideAnnouncement = () => setShowAnnouncement(false);

  return showAnnouncement ? (
    <div className="fcr-chat-announcement">
      {isHost && (
        <div className="fcr-chat-announcement-close">
          <SvgImg onClick={hideAnnouncement} type={SvgIconEnum.FCR_CLOSE} size={12}></SvgImg>
        </div>
      )}

      <div className="fcr-chat-announcement-title">Announcement</div>
      <div
        className="fcr-chat-announcement-content"
        dangerouslySetInnerHTML={{ __html: announcement }}></div>
      <div className="fcr-chat-announcement-action">
        {isHost ? (
          <Button size="XXS" type="secondary" onClick={() => setShowAnnouncementInput(true)}>
            Modify
          </Button>
        ) : (
          <Button size="XXS" onClick={hideAnnouncement}>
            Got it
          </Button>
        )}
      </div>
    </div>
  ) : null;
});
