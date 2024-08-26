import React, { useEffect, useMemo, useState } from 'react'
import './index.css'
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import { useStore } from '../../../../hooks/useStore';
import emptyPng from './empty.png'
import { useI18n } from 'agora-common-libs';
import { Avatar } from '@components/avatar';
import classNames from 'classnames';
import { observer } from 'mobx-react';
const PrivateDialog = observer(({ setIsShowStudents }: {setIsShowStudents: (arg0: boolean) => void}) => {
    const {
        roomStore: {
          isLandscape,
          forceLandscape,
          isBreakOutRoomDisable,
          isBreakOutRoomEnabled,
          isBreakOutRoomIn
        },
        fcrChatRoom,
        userStore: { searchUserList, searchKey, setSearchKey, privateUser, setPrivateUser },
      } = useStore();
      const transI18n = useI18n();
      const [height, setHeight] = useState(0)
      
      const searchUserLists = useMemo(() => {
        return searchUserList.filter((user) => user.userId !== fcrChatRoom.userInfo?.userId)
      }, [searchUserList, fcrChatRoom.userInfo?.userId])
      useEffect(() => {
        const innerHeight = window.innerHeight;
        const domHeight = document.querySelector('.fcr-chatroom-mobile-inputs-chat-dialog-main')?.getBoundingClientRect().height || 0;
        const dialogHeight  = domHeight > innerHeight * 0.8 ? innerHeight * 0.8 : domHeight
        setHeight(dialogHeight)

      }, [searchUserLists.length])
      const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target
        setSearchKey(value)
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

  return (
    <div className='fcr-chatroom-mobile-inputs-chat-dialog'>
        <div className={classNames('fcr-chatroom-mobile-inputs-chat-dialog-main')} style={isLandscape ? { height: !height ? 'auto' : `${height}px`} : undefined} onClick={(e) =>  e.stopPropagation() }>
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
              <input className='fcr-chatroom-mobile-inputs-chat-search-input' type="search" placeholder={transI18n('fcr_chat_dialog_placeholder')} onChange={handleSearchChange} />
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
              {searchUserLists.length === 0 && searchKey && (
                <div className="fcr-chatroom-mobile-inputs-chat-list-empty-placeholder">
                  <img className='fcr-chatroom-mobile-inputs-chat-list-empty-img' src={emptyPng} alt="no_data" />
                  <span>{transI18n('fcr_chat_no_data')}</span>
                </div>
              )}
              {!searchKey && !!searchUserList.length && <div className='fcr-chatroom-mobile-inputs-chat-list' onClick={handleSelectAll}>
                <div className='fcr-chatroom-mobile-inputs-chat-list-name'>
                  <div className='fcr-chatroom-mobile-inputs-chat-list-all'>
                    <SvgImgMobile 
                      forceLandscape={forceLandscape}
                      landscape={isLandscape}
                      type={SvgIconEnum.CHAT_ALL}
                      size={32} />
                  </div>
                  
                  <span className='fcr-chatroom-mobile-inputs-chat-list-name-val'>{isBreakOutRoomEnabled && isBreakOutRoomIn  ?  transI18n('chat.chat_option_my_group') :
                          isBreakOutRoomEnabled && !isBreakOutRoomIn  ?  transI18n('chat.chat_option_main_room') : transI18n('chat.chat_option_all')}</span>
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
        </div>
  )
})
export default PrivateDialog

