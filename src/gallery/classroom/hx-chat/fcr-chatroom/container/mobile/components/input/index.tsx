import { observer } from 'mobx-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import { useStore } from '../../../../hooks/useStore';
import { emojis } from '../../../../utils/emoji';
import './index.css';
import { useI18n } from 'agora-common-libs';
import { useClickAnywhere } from '../../../../utils/hooks';
import classNames from 'classnames';
import { AgoraExtensionWidgetEvent } from '../../../../../../../../events';
import { MobileCallState } from '../../../../store/room';
import { ToolTip } from '../tooltip';
import emptyPng from './empty.png'
import { Avatar } from '../../../../../../../../../../fcr-ui-kit/src/components/avatar';

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
    const [isShowStudents, setIsShowStudents] = useState(false)
    const transI18n = useI18n();

    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
      broadcastWidgetMessage,
      messageStore: { sendTextMessage, sendImageMessage },
      roomStore: {
        pollMinimizeState,
        allMuted,
        isLandscape,
        messageVisible,
        setMessageVisible,
        forceLandscape,
        landscapeToolBarVisible,
        quitForceLandscape,
        mobileCallState,
      },
      fcrChatRoom,
      userStore: { searchUserList, searchKey, setSearchKey, privateUser, setPrivateUser, userMuted, isRaiseHand, raiseHand, lowerHand, raiseHandTooltipVisible },
    } = useStore();
    const getCallIcon = () => {
      switch (mobileCallState) {
        case MobileCallState.Initialize:
          return {
            icon: SvgIconEnum.DEVICE_OFF_CALL_MOBILE,
          };
        case MobileCallState.VideoAndVoiceCall:
          return {
            icon: SvgIconEnum.CALLING_MOBILE,
          };
        case MobileCallState.VoiceCall:
          return {
            icon: SvgIconEnum.VOICE_CALLING_MOBILE,
          };
        case MobileCallState.VideoCall:
          return {
            icon: SvgIconEnum.VIDEO_CALLING_MOBILE,
          };
        case MobileCallState.DeviceOffCall:
          return {
            icon: SvgIconEnum.DEVICE_OFF_CALL_MOBILE,
          };
        default:
          return {
            icon: SvgIconEnum.DEVICE_OFF_CALL_MOBILE,
          };
      }
    };
    const isMuted = allMuted || userMuted;
    const send = useCallback(() => {
      // sendTextMessage(text);
      sendTextMessage(text, privateUser ? [privateUser] : undefined);
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
        sendImageMessage(file, privateUser ? [privateUser] : undefined);
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
    const inputVisible =
      (messageVisible && landscapeToolBarVisible && pollMinimizeState) || !isLandscape;
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      setSearchKey(value)
    }
    const handleShowDialog = () => {
      setIsShowStudents(!isShowStudents)
      setSearchKey('')
    }
    const handleCloseDialog = () => {
      setIsShowStudents(false)
    }
    const handleSetPrivate = (user: any) => {
      setPrivateUser(user)
      setIsShowStudents(false)
    }
    const handleSelectAll = () => {
      setPrivateUser(undefined)
      setIsShowStudents(false)
    }
    const [isHidePrivate, setIsHidePrivate] = useState(false)
    useEffect(() => {
        // 选择你想要监听的DOM元素
        const element = document.querySelector('.fcr-chatroom-mobile-inputs-input-main');
        if (element) {
          // 创建一个ResizeObserver实例并定义回调函数
          const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
              const width = entry.contentRect.width;
              if (width <= 125) {
                setIsHidePrivate(true)
              } else {
                setIsHidePrivate(false)
              }
            }
          });

          // 开始监听元素的尺寸变化
          resizeObserver.observe(element);
        }
        
    }, [])
    const searchUserLists = useMemo(() => {
      return searchUserList.filter((user) => user.userId !== fcrChatRoom.userInfo?.userId)
    }, [searchUserList, fcrChatRoom.userInfo?.userId])
    return (
      <>
        <div
          className={classNames('fcr-chatroom-mobile-inputs', {
            'fcr-chatroom-mobile-inputs-landscape': isLandscape,
          })}
          style={{
            visibility: landscapeToolBarVisible ? 'visible' : 'hidden',
            opacity: landscapeToolBarVisible ? 1 : 0,
            transition: 'visibility .2s, opacity .2s',
            zIndex: 1,
          }}>
            {!isLandscape && 
              <div className='fcr-chatroom-mobile-inputs-content'>
                <div className='fcr-chatroom-mobile-inputs-private'>
                  <span className='fcr-chatroom-mobile-inputs-private-label'>{transI18n('chat.send_to')}:</span>
                  <div className='fcr-chatroom-mobile-inputs-private-select' onClick={handleShowDialog}>
                    <span className='fcr-chatroom-mobile-inputs-private-select-val'>{privateUser?.userId ? privateUser.nickName : transI18n('chat.chat_option_all')}</span>
                    <SvgImgMobile
                      forceLandscape={forceLandscape}
                      landscape={isLandscape}
                      type={SvgIconEnum.PRIVATE_SELECT}
                      size={16}></SvgImgMobile>
                  </div>
                  <div className='fcr-chatroom-mobile-inputs-private-icon'>
                    <div className='fcr-chatroom-mobile-inputs-private-icon-svg'>
                      <SvgImgMobile
                        forceLandscape={forceLandscape}
                        landscape={isLandscape}
                        type={SvgIconEnum.PRIVATE}
                        size={16}></SvgImgMobile>
                    </div>
                      <span className='fcr-chatroom-mobile-inputs-private-icon-val'>{transI18n('chat.private')}</span>
                  </div>
                </div>
                <div className='fcr-chatroom-mobile-inputs-main'>
                  <div
                  className='fcr-chatroom-mobile-inputs-input'
                  style={{
                    visibility: inputVisible ? 'visible' : 'hidden',
                    opacity: inputVisible ? 1 : 0,
                    transition: 'opacity .2s',
                  }}>
                  <div
                    className="fcr-chatroom-mobile-inputs-input-wrap">
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
                      style={{
                        width: isLandscape ? '100%' : '',
                      }}
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
                      <>
                        <input
                          ref={fileInputRef}
                          onChange={handleFileInputChange}
                          accept="image/*"
                          type="file"
                          style={{ display: 'none' }}></input>
                      </>
                      <ToolTip
                        content={transI18n('fcr_participants_tips_lower_hand')}
                        visible={raiseHandTooltipVisible}>
                        <div
                          onClick={isRaiseHand ? lowerHand : raiseHand}
                          className={classNames('fcr-chatroom-mobile-inputs-raise-hand', {
                            'fcr-chatroom-mobile-inputs-raise-hand-active': isRaiseHand,
                          })}>
                          <SvgImgMobile
                            type={SvgIconEnum.RAAISE_HANDS}
                            size={18}
                            landscape={isLandscape}
                            forceLandscape={forceLandscape}></SvgImgMobile>
                        </div>
                      </ToolTip>
                      <div
                        style={{
                          display: isLandscape ? 'none' : 'flex',
                        }}
                        className="fcr-chatroom-mobile-inputs-call"
                        onClick={openHandsUpActionSheet}>
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
                          // colors={{ ...getCallIcon().colors }}
                          size={30}></SvgImgMobile>
                      </div>
                      {/* <ThumbsUp></ThumbsUp> */}
                    </>
                  )}
                </div>
              </div>
            }
         
          {isLandscape && 
          <div className='fcr-chatroom-mobile-inputs-mobile-content'>
            <div className='fcr-chatroom-mobile-inputs-mobile-left'>
              {text ? null : (
                <div
                  className="fcr-chatroom-mobile-inputs-hide-message"
                  onClick={toggleMessageVisible}>
                  {messageVisible ? (
                    <SvgImgMobile
                      forceLandscape={forceLandscape}
                      landscape={isLandscape}
                      type={
                        isLandscape ? SvgIconEnum.MESSAGE_OPENED_NEW : SvgIconEnum.MESSAGE_OEPNED
                      }
                      size={30}></SvgImgMobile>
                  ) : (
                    <SvgImgMobile
                      forceLandscape={forceLandscape}
                      landscape={isLandscape}
                      type={
                        isLandscape ? SvgIconEnum.MESSAGE_CLOSED_NEW : SvgIconEnum.MESSAGE_CLOSED
                      }
                      size={30}></SvgImgMobile>
                  )}
                </div>
              )}
              <div className='fcr-chatroom-mobile-inputs-mobile-left-main'>
                <div className='fcr-chatroom-mobile-private'style={{
                  visibility: inputVisible ? 'visible' : 'hidden',
                  opacity: inputVisible ? 1 : 0,
                  transition: 'opacity .2s',
                }}>
                    <span style={{ whiteSpace: 'nowrap' }}>{transI18n('fcr_chat_label_i_said_to')}:</span>
                    <div className='fcr-chatroom-mobile-inputs-private-select' onClick={handleShowDialog}>
                      <span className='fcr-chatroom-mobile-inputs-private-select-val'>{privateUser?.userId ? privateUser.nickName : transI18n('chat.chat_option_all')}</span>
                      <SvgImgMobile
                        forceLandscape={forceLandscape}
                        landscape={isLandscape}
                        type={SvgIconEnum.PRIVATE_SELECT}
                        size={16}></SvgImgMobile>
                    </div>
                </div>
                <div
                  className='fcr-chatroom-mobile-inputs-input fcr-chatroom-mobile-inputs-input-force-landscape'
                  style={{
                    visibility: inputVisible ? 'visible' : 'hidden',
                    opacity: inputVisible ? 1 : 0,
                    transition: 'opacity .2s',
                  }}>
                  <div
                    className="fcr-chatroom-mobile-inputs-input-wrap">
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
                    {privateUser && 
                      <div className='fcr-chatroom-mobile-inputs-private-icon private'>
                        <div className='fcr-chatroom-mobile-inputs-private-icon-svg'>
                          <SvgImgMobile
                            forceLandscape={forceLandscape}
                            landscape={isLandscape}
                            type={SvgIconEnum.PRIVATE}
                            size={16}></SvgImgMobile>
                        </div>
                        {isHidePrivate && <span className='fcr-chatroom-mobile-inputs-private-icon-val'>{transI18n('chat.private')}</span>}
                      </div>
                    }
                    <input
                      className={classNames('fcr-chatroom-mobile-inputs-input-main', privateUser && 'private')}
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
                      } 
                    />
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
                </div>
              </div>
            </div>
            <div className='fcr-chatroom-mobile-inputs-mobile-right'>
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
                    <>
                      <input
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        accept="image/*"
                        type="file"
                        style={{ display: 'none' }}></input>
                    </>
                    <ToolTip
                      content={transI18n('fcr_participants_tips_lower_hand')}
                      visible={raiseHandTooltipVisible}>
                      <div
                        onClick={isRaiseHand ? lowerHand : raiseHand}
                        className={classNames('fcr-chatroom-mobile-inputs-raise-hand', {
                          'fcr-chatroom-mobile-inputs-raise-hand-active': isRaiseHand,
                        })}>
                        <SvgImgMobile
                          type={SvgIconEnum.RAAISE_HANDS}
                          size={18}
                          landscape={isLandscape}
                          forceLandscape={forceLandscape}></SvgImgMobile>
                      </div>
                    </ToolTip>
                    <div
                      style={{
                        display: isLandscape ? 'none' : 'flex',
                      }}
                      className="fcr-chatroom-mobile-inputs-call"
                      onClick={openHandsUpActionSheet}>
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
                        // colors={{ ...getCallIcon().colors }}
                        size={30}></SvgImgMobile>
                    </div>
                    {/* <ThumbsUp></ThumbsUp> */}
                  </>
                )}
            </div>
          </div>
          }
        </div>
        {isShowStudents && <div className='fcr-chatroom-mobile-inputs-chat-dialog' onClick={handleCloseDialog}>
          <div className={classNames('fcr-chatroom-mobile-inputs-chat-dialog-main', isLandscape && 'active')} onClick={(e) =>  e.stopPropagation() }>
          <div className='fcr-chatroom-mobile-inputs-chat-dialog-split'></div>
            <div className='fcr-chatroom-mobile-inputs-chat-dialog-title'>
              <div className='fcr-chatroom-mobile-inputs-chat-dialog-close' onClick={handleCloseDialog}>
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.CHAT_CLOSE}
                  size={14.4}
                  />
              </div>
              {transI18n('fcr_chat_label_send_to')}
            </div>
            <div className='fcr-chatroom-mobile-inputs-chat-search'>
              <input className='fcr-chatroom-mobile-inputs-chat-search-input' value={searchKey} type="text" placeholder={transI18n('fcr_chat_dialog_placeholder')} onChange={handleSearchChange} />
              <div className='fcr-chatroom-mobile-inputs-chat-search-icon'>
                <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.CHAT_SEARCH}
                    size={16}
                    />
              </div>
               
            </div>
            <div className={classNames('fcr-chatroom-mobile-inputs-chat-lists', searchUserLists.length === 0 && 'nodata')}>
              {searchUserLists.length === 0 && (
                <div className="fcr-chatroom-mobile-inputs-chat-list-empty-placeholder">
                  <img className='fcr-chatroom-mobile-inputs-chat-list-empty-img' src={emptyPng} alt="no_data" />
                  <span>{transI18n('fcr_chat_no_data')}</span>
                </div>
              )}
              {!searchKey && !!searchUserLists.length && <div className='fcr-chatroom-mobile-inputs-chat-list' onClick={handleSelectAll}>
                <div className='fcr-chatroom-mobile-inputs-chat-list-name'>
                  <div className='fcr-chatroom-mobile-inputs-chat-list-all'>
                    <SvgImgMobile 
                      forceLandscape={forceLandscape}
                      landscape={isLandscape}
                      type={SvgIconEnum.CHAT_ALL}
                      size={32} />
                  </div>
                  
                  <span className='fcr-chatroom-mobile-inputs-chat-list-name-val'>{transI18n('chat.chat_option_all')}</span>
                </div>
                {!privateUser?.userId ? <div className='fcr-chatroom-mobile-inputs-chat-list-select'>
                  <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.CHAT_SELECT}
                    size={20}
                    />
                </div> : <div className='fcr-chatroom-mobile-inputs-chat-list-select-empty' />}
              </div>}
              {searchUserLists.length > 0 && searchUserLists.map((user) => {
                let txts: string[] = ['', '', '']
                if (searchKey) {
                  const index = user.nickName.indexOf(searchKey)
                  txts[0] = user.nickName.slice(0, index)
                  txts[1] = searchKey
                  txts[2] = user.nickName.slice(index + searchKey.length, user.nickName.length)
                } else {
                  txts = [user.nickName, '', '']
                }
               
                return (
                  <div key={user.userId} className='fcr-chatroom-mobile-inputs-chat-list' onClick={() => handleSetPrivate(user)}>
                    <div className='fcr-chatroom-mobile-inputs-chat-list-name'>
                      <Avatar size={36} borderRadius='8px' textSize={12} nickName={user.nickName}></Avatar>
                      <span className='fcr-chatroom-mobile-inputs-chat-list-name-val'>
                        {txts[0]}
                        <span className='fcr-chatroom-mobile-inputs-chat-list-name-search'>{txts[1]}</span>{txts[2]}</span>
                    </div>
                    {user.userId === privateUser?.userId ? <div className='fcr-chatroom-mobile-inputs-chat-list-select'>
                      <SvgImgMobile
                        forceLandscape={forceLandscape}
                        landscape={isLandscape}
                        type={SvgIconEnum.CHAT_SELECT}
                        size={20}
                        />
                    </div> : <div className='fcr-chatroom-mobile-inputs-chat-list-select-empty' />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>}
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
