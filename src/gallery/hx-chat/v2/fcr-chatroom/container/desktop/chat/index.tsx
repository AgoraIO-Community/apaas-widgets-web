import './index.css';
import { Input } from '@components/input';
import { TextArea } from '@components/textarea';
import { Button } from '@components/button';

import { Switch } from '@components/switch';
import { observer } from 'mobx-react';
import { useState } from 'react';
import { useStore } from '../../../hooks/useStore';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import classnames from 'classnames';
import { generateShortUserName } from '../../../utils/name';

import {
  AgoraIMCmdActionEnum,
  AgoraIMCustomMessage,
  AgoraIMMessageBase,
  AgoraIMMessageType,
  AgoraIMTextMessage,
} from '../../../../../../im/wrapper/typs';
import { useI18n } from 'agora-common-libs/lib/i18n';
export const FcrChatContainer = observer(() => {
  const {
    messageStore: { showAnnouncementInput },
  } = useStore();
  return (
    <div className="fcr-chat-container">
      <Messages></Messages>
      {showAnnouncementInput ? <AnnouncementInput></AnnouncementInput> : <ChatInput></ChatInput>}
    </div>
  );
});
const ChatInput = observer(() => {
  const [inputFocus, setInputFocus] = useState(false);

  const {
    messageStore: {
      messageInputText,
      setMessageInputText,
      sendTextMessage,
      showAnnouncement,
      setShowAnnouncement,
      setShowAnnouncementInput,
      announcement,
    },
    roomStore: { allMuted, isHost, setAllMute },
  } = useStore();
  const sendDisabled = !messageInputText;
  const send = () => {
    if (sendDisabled) return;
    sendTextMessage(messageInputText);
    setMessageInputText('');
  };
  return (
    <div className="fcr-chat-input-container">
      <div className="fcr-chat-input-wrap">
        <div className="fcr-chat-input-actions">
          <div className="fcr-chat-input-actions-label">
            <div
              onClick={() => {
                if (isHost && !announcement) {
                  setShowAnnouncementInput(true);
                  return;
                }
                if (!showAnnouncement) {
                  setShowAnnouncement(true);
                }
              }}
              className={classnames('fcr-chat-input-actions-item', {
                'fcr-chat-input-actions-item-active': showAnnouncement,
              })}>
              <SvgImg type={SvgIconEnum.FCR_NOTICE} size={30}></SvgImg>
            </div>
          </div>
          <div className="fcr-chat-input-actions-mute-all">
            <span>All Chat Muted</span>
            <Switch onChange={(val) => setAllMute(val)} value={allMuted}></Switch>
          </div>
        </div>
        <div className={classnames('fcr-chat-input', { 'fcr-chat-input-focus': inputFocus })}>
          <SvgImg
            className={classnames('fcr-chat-input-send', {
              'fcr-chat-input-send-disabled': sendDisabled,
            })}
            onClick={send}
            type={SvgIconEnum.FCR_SEND}
            size={36}></SvgImg>
          <TextArea
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
const AnnouncementInput = observer(() => {
  const {
    messageStore: {
      announcementInputText,
      setAnnouncementInputText,
      setShowAnnouncementInput,
      updateAnnouncement,
    },
  } = useStore();
  return (
    <div className="fcr-chat-announcement-input-wrap">
      <div className="fcr-chat-announcement-input">
        <div className="fcr-chat-announcement-input-title">Announcement</div>
        <div className="fcr-chat-announcement-input-textarea">
          <TextArea
            value={announcementInputText}
            onChange={setAnnouncementInputText}
            maxCount={150}
            resizable={false}></TextArea>
        </div>
      </div>
      <div className="fcr-chat-announcement-submit">
        <Button size="S" styleType="gray" onClick={() => setShowAnnouncementInput(false)}>
          Cancel
        </Button>
        <Button
          size="S"
          onClick={() => {
            updateAnnouncement(announcementInputText);
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
      <AnnounceMent></AnnounceMent>
      <MessageList></MessageList>
    </div>
  );
});
const MessageList = observer(() => {
  const {
    messageStore: { renderableMessageList },
  } = useStore();
  return (
    <div className="fcr-chat-message-list fcr-scrollbar-override">
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
const CmdMessageItem = ({ message }: { message: AgoraIMCustomMessage }) => {
  return (
    <div className="fcr-chat-message-list-item-custom">
      {convertCmdMessageAction(message.action)}
    </div>
  );
};
const MessageListItem = observer(({ messages }: { messages: AgoraIMMessageBase[] }) => {
  const { fcrChatRoom } = useStore();
  const lastMessage = messages[messages.length - 1];

  const isSelfMessage = lastMessage.from === fcrChatRoom.userInfo?.userId;
  const renderPlacement = isSelfMessage ? 'right' : 'left';
  const showAvatar = renderPlacement === 'left';
  const [actionVisible, setActionVisible] = useState(false);
  const toggleAction = () => {
    setActionVisible(!actionVisible);
  };

  return (
    <div
      className={classnames(
        'fcr-chat-message-list-item',
        `fcr-chat-message-list-item-placement-${renderPlacement}`,
      )}>
      {showAvatar && (
        <div className="fcr-chat-message-list-item-left">
          <div className="fcr-chat-message-list-item-avatar-container" onClick={toggleAction}>
            <div className="fcr-chat-message-list-item-avatar">
              {generateShortUserName(lastMessage.ext?.nickName || '')}
            </div>
            <div
              className={classnames('fcr-chat-message-list-item-avatar-action', {
                'fcr-chat-message-list-item-avatar-action-visible': actionVisible,
              })}>
              <div>
                <Button size="XXS">mute</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fcr-chat-message-list-item-right">
        <div className="fcr-chat-message-list-item-extra">
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
        <SvgImg
          className="fcr-chat-announcement-close"
          onClick={hideAnnouncement}
          type={SvgIconEnum.FCR_CLOSE}
          size={24}></SvgImg>
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
