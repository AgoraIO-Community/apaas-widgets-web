import React, { useEffect, useMemo, useRef, useState } from 'react'
import './index.css'
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import { useStore } from '../../../../hooks/useStore';
import { useI18n } from 'agora-common-libs';
import { Avatar } from '@components/avatar';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import { TextArea } from '../../../../../../../../components/textarea';
import classnames from 'classnames';
import PrivateDialog from '../private-dialog';
import { MessageList } from '../message-list';



const ChatDialog = observer(({ setIsShowChat }: { setIsShowChat: (arg0: boolean) => void }) => {
  const {
    roomStore: {
      addToast,
      isLandscape,
      forceLandscape,
      isBreakOutRoomDisable,
      isBreakOutRoomEnabled,
      isBreakOutRoomIn,
      allMuted,
      quitForceLandscape,
    },
    messageStore: { sendTextMessage, sendImageMessage },
    fcrChatRoom,
    userStore: {
      userList,
      userMuted,
      searchUserList,
      searchKey,
      setSearchKey,
      privateUser,
      setPrivateUser,
      chatGroup
    },
  } = useStore();
  const transI18n = useI18n();
  const [height, setHeight] = useState(0)
  const [inputFocus, setInputFocus] = useState(false);

  const [isShowPrivate, setIsShowPrivate] = useState(false);
  const [showCount, setShowCount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<{ dom: HTMLTextAreaElement | null }>({
    dom: null,
  });
  const isMuted = allMuted || userMuted;
  const [text, setText] = useState('');

  const searchUserLists = useMemo(() => {
    return searchUserList.filter((user) => user.userId !== fcrChatRoom.userInfo?.userId)
  }, [searchUserList, fcrChatRoom.userInfo?.userId])
  useEffect(() => {
    const innerHeight = window.innerHeight;
    const domHeight = document.querySelector('.fcr-chatroom-mobile-inputs-chat-dialog-main')?.getBoundingClientRect().height || 0;
    const dialogHeight = domHeight > innerHeight * 0.8 ? innerHeight * 0.8 : domHeight
    setHeight(dialogHeight)

  }, [searchUserLists.length])
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    // setSearchKey(value)
  }
  const handleCloseDialog = () => {
    setIsShowChat(false)
  }
  const handleSetPrivate = (user: any) => {
    setPrivateUser(user)
  }
  const handleSelectAll = () => {
    setPrivateUser(undefined)
  }

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

  const send = () => {
    // sendTextMessage(text);

    const isPrivateInRoom = userList.find((v) => v.userId === privateUser?.userId);
    if (!isPrivateInRoom && privateUser?.userId) {
      addToast(transI18n('fcr_private_leave_room', { reason: privateUser?.nickName }), 'warning');
    }
    sendTextMessage(text, privateUser ? [privateUser] : undefined);
    setText('');
    textAreaRef.current.dom?.blur();
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

      sendTextMessage(
        text.slice(0, currSelectationStart) +
        '\n' +
        text.slice(currSelectationStart),
      );
    }
  };

  const handleShowPrivate = () => {
    setIsShowPrivate(!isShowPrivate);
    setSearchKey('');
  }

  useEffect(() => {
    const handleResize = () => {
      const newHeight = textAreaRef.current.dom?.scrollHeight;
      if (newHeight && ((+newHeight / 19.5) >= 3)) {
        setShowCount(true);
      } else {
        setShowCount(false);
      }
    };

    textAreaRef.current.dom && textAreaRef.current.dom.addEventListener('resize', handleResize);

    return () => {
      textAreaRef.current.dom && textAreaRef.current.dom.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleChangeTextarea = (e: string) => {
    setText(e);
  }

  return (
    <div className='fcr-chatroom-mobile-inputs-chat-dialog'>
      <div className={classNames('fcr-chatroom-mobile-inputs-chat-dialog-main')} style={isLandscape ? { height: !height ? 'auto' : `${height}px` } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className='fcr-chatroom-mobile-inputs-chat-dialog-title'>
          {transI18n('chat.chat')}
          <div className='fcr-chatroom-mobile-inputs-chat-dialog-full-screen' onClick={handleCloseDialog}>
            <SvgImgMobile
              forceLandscape={forceLandscape}
              landscape={isLandscape}
              type={SvgIconEnum.CHAT_FULL_SCREEN}
              size={15.6}
            />
          </div>
          <div className='fcr-chatroom-mobile-inputs-chat-dialog-close' onClick={handleCloseDialog}>
            <SvgImgMobile
              forceLandscape={forceLandscape}
              landscape={isLandscape}
              type={SvgIconEnum.CHAT_CLOSE_NEW}
              size={15.6}
            />
          </div>
        </div>
        <MessageList></MessageList>
        <div className='fcr-chatroom-mobile-inputs-chat-search'>
          <div className='fcr-chatroom-mobile-inputs-person-list'>
            <span className="fcr-chatroom-mobile-inputs-private-label">
              {transI18n('chat.send_to')}：
            </span>
            <div className="fcr-chatroom-mobile-inputs-private-select" onClick={handleShowPrivate} >
              <span className="fcr-chatroom-mobile-inputs-private-select-val">
                {privateUser?.userId ? privateUser.nickName :
                  isBreakOutRoomEnabled && isBreakOutRoomIn && chatGroup ? transI18n('chat.chat_option_my_group') :
                    isBreakOutRoomEnabled && !isBreakOutRoomIn ? transI18n('chat.chat_option_main_room') : transI18n('chat.chat_option_all')}
              </span>
              <SvgImgMobile
                forceLandscape={forceLandscape}
                landscape={isLandscape}
                type={SvgIconEnum.PRIVATE_SELECT}
                size={16}></SvgImgMobile>
            </div>
            {privateUser && (
              <div className="fcr-chatroom-mobile-inputs-private-icon">
                <div className="fcr-chatroom-mobile-inputs-private-icon-svg">
                  <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.PRIVATE}
                    size={16}></SvgImgMobile>
                </div>
                <span className="fcr-chatroom-mobile-inputs-private-icon-val">
                  {transI18n('chat.private')}
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              type="file"
              style={{ display: 'none' }}
            />
          </div>

          <div className='fcr-chatroom-mobile-inputs-chat-search-input-wrapped'>
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

            <div
              className={classnames('fcr-chat-input', {
                'fcr-chat-input-focus': inputFocus,
                'fcr-chat-input-focus-text': !!text
              })}>
              {text && <SvgImgMobile
                className={classnames('fcr-chat-input-send', {
                  'fcr-chat-input-send-disabled': !text,
                })}
                forceLandscape={forceLandscape}
                landscape={isLandscape}
                type={SvgIconEnum.CHAT_SEND}
              />}
              <TextArea
                ref={textAreaRef}
                onKeyDown={handleKeyDown}
                autoSize={{ maxHeight: 94, minHeight: 20 }}
                maxCount={200}
                overflowIsInput={true}
                showCount={showCount}
                // onFocusChange={setInputFocus}
                resizable={false}
                placeholder={transI18n('fcr_chat_box_dialog_placeholder')}
                value={text}
                onChange={handleChangeTextarea}></TextArea>
            </div>
            {!text && <div
              className='fcr-chatroom-mobile-inputs-chat-search-icon'
              onClick={handleImgInputClick}
            >
              <SvgImgMobile
                forceLandscape={forceLandscape}
                landscape={isLandscape}
                type={SvgIconEnum.CHAT_IMAGE_PICK}
              />
            </div>}
          </div>
        </div>
        {isShowPrivate && <PrivateDialog setIsShowStudents={setIsShowPrivate} />}
      </div>
    </div>
  )
})
export default ChatDialog

