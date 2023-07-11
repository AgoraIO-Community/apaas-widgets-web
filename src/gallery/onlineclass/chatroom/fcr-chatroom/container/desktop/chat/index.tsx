import './index.css';
import { TextArea } from '@components/textarea';
import { Button } from '@components/button';
import { Switch } from '@components/switch';
import { observer } from 'mobx-react';
import { useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useStore } from '../../../hooks/useStore';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import classnames from 'classnames';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
import {
  AgoraIMCmdActionEnum,
  AgoraIMCustomMessage,
  AgoraIMImageMessage,
  AgoraIMMessageBase,
  AgoraIMMessageExt,
  AgoraIMMessageType,
  AgoraIMTextMessage,
} from '../../../../../../../common/im/wrapper/typs';
import { useI18n } from 'agora-common-libs';
import { ToolTip } from '@components/tooltip';
import { useScroll } from '../../../hooks/useScroll';
import { EduRoleTypeEnum } from 'agora-edu-core';
import { Avatar } from '@components/avatar';
import { Popover } from '@components/popover';
import { useMute } from '../../../hooks/useMute';

import { FcrChatroomToastContext } from '..';
import dayjs from 'dayjs';
import { AutoSizer, CellMeasurer, List, ListRowProps } from 'react-virtualized';
import { getNameColor } from '@components/avatar/helper';
import { Input } from '@components/input';
import { AgoraIMUserInfo, AgoraIMUserInfoExt } from 'src/common/im/wrapper/typs';
import { emojis } from '../../../utils/emoji';

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
  const textAreaRef = useRef<{ dom: HTMLTextAreaElement | null }>({
    dom: null,
  });
  const {
    messageStore: {
      messageInputText,
      setMessageInputText,
      sendTextMessage,
      messageListScrollToBottom,
    },
    userStore: { privateUser },
  } = useStore();
  const sendDisabled = !messageInputText;
  const send = () => {
    if (sendDisabled) return;
    sendTextMessage(messageInputText, privateUser ? [privateUser] : undefined);
    setMessageInputText('');
    messageListScrollToBottom();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.keyCode === 13 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      send();
    } else if (
      (e.keyCode === 13 && e.ctrlKey) ||
      (e.keyCode === 13 && e.metaKey) ||
      (e.keyCode === 13 && e.altKey)
    ) {
      const currSelectationStart = textAreaRef.current?.dom?.selectionStart;

      setMessageInputText(
        messageInputText.slice(0, currSelectationStart) +
          '\n' +
          messageInputText.slice(currSelectationStart),
      );
    }
  };

  return (
    <div className="fcr-chat-input-container">
      <div className="fcr-chat-input-wrap">
        <div className="fcr-chat-input-actions">
          <div className="fcr-chat-input-actions-label">
            <PrivateChat />
          </div>
          <div className="fcr-chat-input-actions-functions">
            <FileSender />
            <ChatEmoji />
            <ChatMore />
          </div>
        </div>
        <div
          className={classnames('fcr-chat-input', {
            'fcr-chat-input-focus': inputFocus,
          })}>
          <SvgImg
            className={classnames('fcr-chat-input-send', {
              'fcr-chat-input-send-disabled': sendDisabled,
            })}
            onClick={send}
            type={SvgIconEnum.FCR_SEND}
            size={32}></SvgImg>
          <TextArea
            ref={textAreaRef}
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
  const disabled = !isHost && !announcement;
  const [tootipVisible, setTootipVisible] = useState(false);
  return (
    <ToolTip
      visible={tootipVisible}
      onVisibleChange={(visible) => {
        if (!disabled) {
          setTootipVisible(false);
          return;
        }
        setTootipVisible(visible);
      }}
      content={disabled && 'No announcement'}>
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
          'fcr-chat-input-actions-item-disable': disabled,
        })}>
        <SvgImg type={SvgIconEnum.FCR_NOTICE} size={24}></SvgImg>
      </div>
    </ToolTip>
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
              size={10}></SvgImg>
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
                size: 'small',
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
    messageStore: { renderableMessageList, listCache, messageListScrollToBottom },
  } = useStore();
  const { listRef, handleScroll } = useScroll();
  const renderMessage = (
    messages:
      | AgoraIMMessageBase<unknown, AgoraIMMessageExt>
      | AgoraIMMessageBase<unknown, AgoraIMMessageExt>[],
  ) => {
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
  };

  const rowRenderer = ({ columnIndex, key, parent, index, style }: ListRowProps) => {
    return (
      // @ts-ignore
      <CellMeasurer cache={listCache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
        {({ measure, registerChild }) => {
          const currMsg = renderableMessageList[index];
          const isSingleMsg = !(currMsg instanceof Array);
          const lastMsg = isSingleMsg ? currMsg : currMsg[0];
          return (
            <div
              className={classnames('fcr-chat-message-list-item-wrap', {
                'fcr-chat-message-list-item-wrap-center': isSingleMsg,
              })}
              key={lastMsg.id}
              ref={registerChild as any}
              style={{
                ...style,
              }}>
              {renderMessage(currMsg)}
            </div>
          );
        }}
      </CellMeasurer>
    );
  };
  useEffect(() => {
    messageListScrollToBottom();
  }, []);
  return (
    <div className="fcr-chat-message-list">
      {renderableMessageList.length === 0 && (
        <div className="fcr-chat-message-list-placeholder">
          <SvgImg type={SvgIconEnum.FCR_CHAT_PLACEHOLDER} size={200}></SvgImg>
          <span>No Message</span>
        </div>
      )}
      <AutoSizer>
        {({ width, height }) => {
          return (
            //@ts-ignore
            <List
              scrollToAlignment={'end'}
              className="fcr-scrollbar-override"
              ref={listRef}
              height={height}
              width={width}
              rowCount={renderableMessageList.length}
              deferredMeasurementCache={listCache}
              rowHeight={listCache.rowHeight}
              rowRenderer={rowRenderer}
              onScroll={handleScroll}
            />
          );
        }}
      </AutoSizer>
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
    messageStore: { checkIsPrivateMessage },
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
            <Avatar size={24} textSize={12} nickName={lastMessage?.ext?.nickName || ''}></Avatar>
            {isUserMuted && (
              <div className="fcr-chat-message-list-item-mute-icon">
                <SvgImg type={SvgIconEnum.FCR_SETTING_NONE} size={18}></SvgImg>
              </div>
            )}

            <>
              {isHost && (
                <div
                  className={classnames('fcr-chat-message-list-item-avatar-action', {
                    'fcr-chat-message-list-item-avatar-action-visible': actionVisible,
                    'fcr-bg-transparent': !actionVisible,
                    'fcr-bg-3-a70': actionVisible,
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
              )}
            </>
          </div>
        </div>
      )}

      <div className="fcr-chat-message-list-item-right">
        <div
          className={classnames('fcr-chat-message-list-item-extra', {
            'fcr-chat-message-list-item-extra-private':
              checkIsPrivateMessage(lastMessage) && isMessageFromHost,
          })}>
          {isMessageFromHost && showAvatarAndHost && (
            <div className="fcr-chat-message-list-item-host">Host</div>
          )}

          <div
            className="fcr-chat-message-list-item-name"
            style={isSelfMessage ? {} : { color: getNameColor(lastMessage.ext?.nickName || '') }}>
            {!isSelfMessage && currUser ? (
              <Popover
                trigger="click"
                placement="bottomLeft"
                overlayClassName="fcr-nickname-popover"
                content={<PrivateChatMenu user={currUser} />}>
                <span>{lastMessage.ext?.nickName}</span>
              </Popover>
            ) : (
              lastMessage.ext?.nickName
            )}
          </div>
          {isSelfMessage && checkIsPrivateMessage(lastMessage) && (
            <div className="fcr-chat-private-tag">
              i said to {lastMessage.ext?.receiverList?.[0].nickName}(
              <span className="fcr-text-yellow">Private</span>)
            </div>
          )}
          {!isSelfMessage && checkIsPrivateMessage(lastMessage) && (
            <div className="fcr-chat-private-tag">
              said to me(<span className="fcr-text-yellow">Private</span>)
            </div>
          )}
          {messages[0]?.ts && (
            <div className="fcr-chat-message-list-item-time">
              {dayjs(messages[0].ts).format('HH:mm')}
            </div>
          )}
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
            case AgoraIMMessageType.Image:
              const imageMessage = message as AgoraIMImageMessage;
              return <MessageImageItem message={imageMessage} />;
          }
        })}
      </div>
    </div>
  );
});
const PrivateChatMenu = observer(
  (props: { user: AgoraIMUserInfo<AgoraIMUserInfoExt> | undefined }) => {
    const {
      userStore: { setPrivateUser },
    } = useStore();

    const handleUploadClick = () => {
      props.user && setPrivateUser(props.user);
    };
    return (
      <span onClick={handleUploadClick} className="fcr-private-chat-item">
        Private Chat
      </span>
    );
  },
);
const AnnounceMent = observer(() => {
  const {
    widget,
    messageStore: {
      showAnnouncement,
      announcement,
      setShowAnnouncement,
      setShowAnnouncementInput,
      updateAnnouncement,
    },
    roomStore: { isHost },
  } = useStore();
  const hideAnnouncement = () => setShowAnnouncement(false);

  return showAnnouncement ? (
    <div className="fcr-chat-announcement">
      {isHost && (
        <div className="fcr-chat-announcement-close">
          <SvgImg onClick={hideAnnouncement} type={SvgIconEnum.FCR_CLOSE} size={10}></SvgImg>
        </div>
      )}

      <div className="fcr-chat-announcement-title">Announcement</div>
      <div
        className="fcr-chat-announcement-content"
        dangerouslySetInnerHTML={{ __html: announcement }}></div>
      <div className="fcr-chat-announcement-action">
        {isHost ? (
          <>
            <Button
              size="XXS"
              styleType="danger"
              type="secondary"
              onClick={() => {
                widget.ui.addConfirmDialog({
                  title: 'Delete Confirmation',
                  content: 'Are you sure to delete the announcement?',
                  okButtonProps: { styleType: 'danger' },
                  onOk: async () => {
                    await updateAnnouncement('');
                    widget.ui.addToast('Delete announcement successfully', 'success');
                  },
                });
              }}>
              Delete
            </Button>
            <Button
              size="XXS"
              type="secondary"
              onClick={() => {
                setShowAnnouncementInput(true);
                setShowAnnouncement(false);
              }}>
              Modify
            </Button>
          </>
        ) : (
          <Button size="XXS" onClick={hideAnnouncement}>
            Got it
          </Button>
        )}
      </div>
    </div>
  ) : null;
});

const PrivateChat = observer(() => {
  const {
    userStore: { privateUser, setSearchKey },
  } = useStore();
  return (
    <div className="fcr-private-chat">
      <span>send to:</span>
      <Popover
        overlayClassName="fcr-private-chat-popover"
        trigger="click"
        content={<ChatList />}
        onVisibleChange={() => setSearchKey('')}>
        <span
          className={classnames('fcr-private-base-icon fcr-private-name', {
            'fcr-private-name-active': !!privateUser,
          })}>
          {privateUser ? privateUser.nickName : 'all'}
          <SvgImg type={SvgIconEnum.FCR_DROPDOWN} size={12} />
        </span>
      </Popover>
      {!!privateUser && <span className="fcr-private-tag">Private</span>}
    </div>
  );
});

const UserList = observer(() => {
  const {
    userStore: { searchKey, searchUserList },
  } = useStore();

  return (
    <div className="fcr-chatroom-member-list-wrap fcr-chatroom-member-private-list-wrap">
      <div>
        {searchUserList.length === 0 && (
          <div className="fcr-chatroom-member-list-placeholder">
            <SvgImg type={SvgIconEnum.FCR_CHAT_PLACEHOLDER} size={80}></SvgImg>
            <span>No Data</span>
          </div>
        )}
        {!searchKey && !!searchUserList.length && <AllUserItem />}
        {searchUserList.map((user) => (
          <UserItem key={user.userId} user={user}></UserItem>
        ))}
      </div>
    </div>
  );
});

const SearchInput = observer(() => {
  const {
    userStore: { searchKey, setSearchKey },
  } = useStore();
  return (
    <div className="fcr-chatroom-member-list-search">
      <Input
        size="medium"
        value={searchKey}
        onChange={setSearchKey}
        iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
        placeholder="Search"
      />
    </div>
  );
});

const AllUserItem = observer(() => {
  const {
    userStore: { setPrivateUser },
  } = useStore();
  return (
    <div
      key="all-user"
      className={classnames('fcr-chatroom-member-list-item fcr-chatroom-member-private-list-item')}
      onClick={() => setPrivateUser(undefined)}>
      <div className="fcr-chatroom-member-list-item-info">
        <div className="fcr-chatroom-private-avatar">
          <span>
            <SvgImg type={SvgIconEnum.FCR_PEOPLE} size={24} />
          </span>
        </div>
        <div className="fcr-chatroom-member-list-item-name">All</div>
      </div>
    </div>
  );
});
const UserItem = observer((props: { user: AgoraIMUserInfo<AgoraIMUserInfoExt> }) => {
  const { user } = props;
  const {
    fcrChatRoom,
    userStore: { privateUser, setPrivateUser },
  } = useStore();

  const localUserId = fcrChatRoom.userInfo?.userId || '';
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      key={user.userId}
      className={classnames('fcr-chatroom-member-list-item fcr-chatroom-member-private-list-item', {
        'fcr-chatroom-member-private-list-forbidden': user.userId === localUserId,
      })}
      onClick={() => user.userId !== localUserId && setPrivateUser(user)}>
      <div className="fcr-chatroom-member-list-item-info">
        <div className="fcr-private-chat-list">
          <Avatar size={24} textSize={12} nickName={user.nickName}></Avatar>
        </div>

        <div className="fcr-chatroom-member-list-item-name">{user.nickName}</div>
      </div>

      <div className="fcr-chatroom-member-list-item-tags">
        {privateUser && user.userId === privateUser.userId && (
          <span className="item-tag">Private</span>
        )}
      </div>
    </div>
  );
});

const ChatList = () => {
  return (
    <div className="fcr-private-chatList">
      <SearchInput />
      <UserList />
    </div>
  );
};

const FileSender = () => {
  return (
    <span className="fcr-private-base-icon">
      <Popover
        overlayClassName="customize-file-sender-popover"
        trigger="click"
        placement="topRight"
        content={<FileSenderContent />}>
        <span className="fcr-private-file-icon">
          <SvgImg type={SvgIconEnum.FCR_FILE} size={18} />
          <SvgImg type={SvgIconEnum.FCR_DROPDOWN} size={12} />
        </span>
      </Popover>
    </span>
  );
};

const FileSenderContent = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    messageStore: { sendImageMessage },
    userStore: { privateUser },
  } = useStore();
  const handleFileInputChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      sendImageMessage(file, privateUser ? [privateUser] : undefined);
    }
  };
  const handleUploadClick = () => {
    fileInputRef.current?.focus();
    fileInputRef.current?.click();
  };
  return (
    <div className="fcr-files-container">
      <span onClick={handleUploadClick}>Send Image</span>
      <input
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        type="file"
        style={{ display: 'none' }}
      />
    </div>
  );
};

const EmojiContent = observer(() => {
  const {
    messageStore: { messageInputText, setMessageInputText },
  } = useStore();
  const handleEmojiClick = (emoji: string) => {
    // const currSelectationStart = textAreaRef.current?.dom?.selectionStart;

    setMessageInputText(`${messageInputText}${emoji}`);
  };
  return (
    <div className="fcr-emoji-content">
      {emojis.map((emoji) => {
        return (
          <div
            key={emoji}
            onClick={() => {
              handleEmojiClick(emoji);
            }}>
            {emoji}
          </div>
        );
      })}
    </div>
  );
});

const ChatEmoji = () => {
  return (
    <span className="fcr-private-base-icon fcr-private-action-icon">
      <Popover trigger="click" placement="topRight" content={<EmojiContent />}>
        <SvgImg type={SvgIconEnum.FCR_EMO} size={24} />
      </Popover>
    </span>
  );
};

const ChatMore = () => {
  return (
    <span className="fcr-private-base-icon fcr-private-action-icon">
      <Popover
        trigger="click"
        placement="topRight"
        overlayClassName="fcr-chat-setting-more"
        content={<ChatMoreOptions />}>
        <SvgImg type={SvgIconEnum.FCR_MOBILE_MORE} size={24} />
      </Popover>
    </span>
  );
};

const ChatMoreOptions = () => {
  const {
    messageStore: { sendCustomMessage },
    roomStore: { allMuted, setAllMute, isHost },
  } = useStore();

  const handleAllMute = async (mute: boolean) => {
    await setAllMute(mute);
    sendCustomMessage(
      mute ? AgoraIMCmdActionEnum.AllUserMuted : AgoraIMCmdActionEnum.AllUserUnmuted,
    );
  };
  return (
    <>
      <div className="fcr-chat-setting-title">Chat setting</div>
      <div className="fcr-chat-setting-content">
        {isHost && (
          <div className="fcr-chat-input-actions-mute-all">
            <span>All Chat Muted</span>
            <Switch onChange={handleAllMute} value={allMuted}></Switch>
          </div>
        )}

        <div className="fcr-chat-input-actions-options">
          <span>Announcement</span>
          <AnnouncementTrigger />
        </div>
      </div>
    </>
  );
};

const MessageImageItem = observer((props: { message: AgoraIMImageMessage }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const imageMessage = props.message;
  const imageUrl =
    imageMessage.url || (imageMessage.file ? URL.createObjectURL(imageMessage.file) : '');
  const {
    messageStore: { reRenderMessageList },
  } = useStore();
  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.onload = reRenderMessageList;
      new Viewer(imgRef.current, {
        toolbar: false,
        title: false,
        navbar: false,
      });
    }
  }, []);
  return (
    <>
      <div
        key={imageMessage.id}
        className="fcr-chat-message-list-item-content fcr-chat-message-list-item-image">
        <img src={imageUrl} ref={imgRef} />
      </div>
    </>
  );
});
