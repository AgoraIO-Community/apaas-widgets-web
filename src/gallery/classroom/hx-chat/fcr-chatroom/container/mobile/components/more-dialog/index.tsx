import React, { useEffect, useMemo, useState } from 'react'
import './index.css'
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import { useStore } from '../../../../hooks/useStore';
import emptyPng from './empty.png'
import { useI18n } from 'agora-common-libs';
import { Avatar } from '@components/avatar';
import classNames from 'classnames';
import { observer } from 'mobx-react';
const PrivateDialog = observer(({ setIsShowMore }: {setIsShowMore: (arg0: boolean) => void}) => {
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
        const domHeight = document.querySelector('.fcr-chatroom-mobile-inputs-more-modal-main')?.getBoundingClientRect().height || 0;
        const dialogHeight  = domHeight > innerHeight * 0.8 ? innerHeight * 0.8 : domHeight
        setHeight(dialogHeight)

      }, [searchUserLists.length])
      const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target
        setSearchKey(value)
      }
      const handleCloseDialog = () => {
        setIsShowMore(false)
      }
      const handleSetPrivate = (user: any) => {
        setPrivateUser(user)
        setIsShowMore(false)
      }
      const handleSelectAll = () => {
        setPrivateUser(undefined)
        setIsShowMore(false)
      }

  return (
    <div className='fcr-chatroom-mobile-inputs-more-modal'>
        <div className={classNames('fcr-chatroom-mobile-inputs-more-modal-main')} style={isLandscape ? { height: !height ? 'auto' : `${height}px`} : undefined} onClick={(e) =>  e.stopPropagation() }>
          <div className='fcr-chatroom-mobile-inputs-more-modal-split'></div>
            <div className='fcr-chatroom-mobile-inputs-more-modal-title'>
              <div className='fcr-chatroom-mobile-inputs-more-modal-close' onClick={handleCloseDialog}>
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.CLOSE}
                  size={14.4}
                  />
              </div>
              {transI18n('fcr_more_tip_title')}
            </div>
            <div className='fcr-chatroom-mobile-modal-item-container'>
              <div className='fcr-chatroom-mobile-modal-item-container-icon item1'>
                <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.MOBILE_WHITEBOARDEDIT}
                    size={30}
                    />
              </div>
              <span className='fcr-chatroom-mobile-modal-item-tip'>{transI18n('fcr_more_options_whiteboard')}</span>
              <input className='fcr-chatroom-mobile-modal-item-container-input' type="radio" onChange={handleSearchChange} />
            </div>
            <div className='fcr-chatroom-mobile-modal-item-container'>
              <div className='fcr-chatroom-mobile-modal-item-container-icon item2'>
                <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.RECORDING_PLAY}
                    size={30}
                    />
              </div>
              <span className='fcr-chatroom-mobile-modal-item-tip'>{transI18n('fcr_more_options_youtube')}</span>
              <input className='fcr-chatroom-mobile-modal-item-container-input' type="radio" onChange={handleSearchChange} />
            </div>
            <div className='fcr-chatroom-mobile-modal-item-container'>
              <div className='fcr-chatroom-mobile-modal-item-container-icon item3'>
                <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.MOBILE_SHARESCREEN}
                    size={30}
                    />
              </div>
              <span className='fcr-chatroom-mobile-modal-item-tip'> {transI18n('fcr_more_options_tutor_scream')}</span>
              <input className='fcr-chatroom-mobile-modal-item-container-input' type="radio" onChange={handleSearchChange} />
            </div>
            <div className='fcr-chatroom-mobile-modal-item-container'>
              <div className='fcr-chatroom-mobile-modal-item-container-icon item4'>
                <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.INTERNET}
                    size={30}
                    />
              </div>
              <span className='fcr-chatroom-mobile-modal-item-tip'>{transI18n('fcr_more_options_page_notice')}</span>
              <input className='fcr-chatroom-mobile-modal-item-container-input' type="radio" onChange={handleSearchChange} />
            </div>
            <div className="frc-chatroom-modal-second-title">
              {transI18n('fcr_more_tip_second_title')}
            </div>
            <div className='fcr-chatroom-mobile-modal-item-container'>
              <div className='fcr-chatroom-mobile-modal-item-container-icon item5'>
                <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.MOBILE_VOTE}
                    size={30}
                    />
              </div>
              <span className='fcr-chatroom-mobile-modal-item-tip'>{transI18n('fcr_more_options_poll')}</span>
            </div>
          </div>
        </div>
  )
})
export default PrivateDialog

