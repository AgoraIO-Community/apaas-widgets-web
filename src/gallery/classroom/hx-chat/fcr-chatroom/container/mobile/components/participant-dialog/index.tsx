import classNames from 'classnames';
import { useStore } from '../../../../hooks/useStore';
import { SvgIconEnum, SvgImg } from '../../../../../../../../components/svg-img';
import './index.css';
import { observer } from 'mobx-react';
import { transI18n } from 'agora-common-libs';
import React, { useState } from 'react'
import emptyPng from './empty.png'
import { Avatar } from '@components/avatar';
import { EduClassroomConfig, EduRoleTypeEnum, EduStream, RteRole2EduRole } from 'agora-edu-core';
import ParticipantMoreDialog from '../participant-more-dialog';

const ParticipantDialog = observer(
  ({ setIsShowParticipant }: { setIsShowParticipant: (arg0: boolean) => void }) => {
    const {
      userStore: { searchUserList, searchKey, setSearchKey, setPrivateUser, allUIStreams, checkCameraEnabled, checkMicEnabled },
    } = useStore()
    //当前选择操作更多的处理
    const [cureentOptionsUser, setCureentOptionsUser] = useState<EduStream | null>();
    //设置是否全屏
    const [fullShow, setFullShow] = useState<boolean>(false);
    //关闭函数
    //搜索文本改变
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      setSearchKey(value)
    }

    const showUserList = [...allUIStreams.values()]
    //选择所有
    return (
      <div>
        <div className="fcr-chatroom-mobile-participant"
          style={{ height: fullShow ? '100%' : 'calc(100% - 48px)', borderRadius: fullShow ? '0px' : '16px 16px 0px 0px' }}>
          {!fullShow && <div className="fcr-chatroom-mobile-participant-title">
            <div className="fcr-chatroom-mobile-participant-title-title">{transI18n('fcr_participant_people_count')} ({allUIStreams.values.length})</div>
            <div className='fcr-chatroom-mobile-participant-title-icons'>
              <SvgImg
                className="fcr-chatroom-mobile-participant-title-icon"
                type={SvgIconEnum.PARTICIPANT_FULL_SCREEN}
                size={26}
                onClick={() => { setFullShow(true) }}
              />
              <SvgImg
                className="fcr-chatroom-mobile-participant-title-icon"
                type={SvgIconEnum.PARTICIPANT_CLOSE}
                size={26}
                onClick={() => { setIsShowParticipant(false) }}
              />
            </div>
          </div>}
          {fullShow && <div className='fcr-chatroom-mobile-participant-back' onClick={() => { setFullShow(false) }}>
            <SvgImg
              className="icon"
              type={SvgIconEnum.PARTICIPANT_FULL_SCREEN_BACK}
              size={26}
              colors={{ iconPrimary: 'rgba(254, 254, 254, 1)' }}
            />
            <span className='text'>{transI18n('fcr_participant_back')}</span>
          </div>}
          <div className='fcr-chatroom-mobile-participant-search'>
            <SvgImg
              type={SvgIconEnum.CHAT_SEARCH}
              className='fcr-chatroom-mobile-participant-search-icon'
              size={18}
              colors={{ iconPrimary: 'var(--icon-primary, rgba(21, 21, 21, 1))' }}
            />
            <input className='fcr-chatroom-mobile-participant-search-input' type="search" placeholder={transI18n('fcr_chat_dialog_placeholder')} onChange={handleSearchChange} />
          </div>
          <div className={classNames('fcr-chatroom-mobile-participant-user-lists', showUserList.length === 0 && 'nodata')}>
            {showUserList.length === 0 && searchKey && (
              <div className="fcr-chatroom-mobile-participant-user-list-empty-placeholder">
                <img className='fcr-chatroom-mobile-participant-user-list-empty-img' src={emptyPng} alt="no_data" />
                <span>{transI18n('fcr_chat_no_data')}</span>
              </div>
            )}
            {showUserList.length > 0 && showUserList.map((user) => {
              const showUserName = user.fromUser.userName;
              const showUserId = user.fromUser.userUuid;
              //是否是老师角色
              const isTeacher = EduRoleTypeEnum.teacher === RteRole2EduRole(EduClassroomConfig.shared.sessionInfo.roomType, user.fromUser.role);
              //是否开启了音频
              const enableAudio = checkMicEnabled(user);
              //是否开启了视频
              const enableVideo = checkCameraEnabled(user);
              let txts: string[] = ['', '', '']
              if (searchKey) {
                const index = showUserName.indexOf(searchKey)
                txts[0] = showUserName.slice(0, index)
                txts[1] = searchKey
                txts[2] = showUserName.slice(index + searchKey.length, showUserName.length)
              } else {
                txts = [showUserName, '', '']
              }

              return (
                <div key={showUserId} className='fcr-chatroom-mobile-participant-user-list'>
                  <Avatar size={36} borderRadius='10px' textSize={14} nickName={showUserName}></Avatar>
                  <div className='name-container'>
                    <div className='fcr-chatroom-mobile-participant-user-list-name'
                      style={{ maxHeight: ((isTeacher ? 1 : 3) * 14) + 'px', WebkitLineClamp: (isTeacher ? 1 : 2) }}>
                      {txts[0]}
                      <span className='fcr-chatroom-mobile-participant-user-list-name-search'>{txts[1]}</span>{txts[2]}
                    </div>
                    {isTeacher &&
                      <div className='fcr-chatroom-mobile-participant-user-list-name-role'>
                        <SvgImg
                          type={SvgIconEnum.ICON_ROLE_TYPE_TEACHER}
                          size={18}
                          colors={{ iconPrimary: 'rgba(255, 255, 255, 1)' }} />
                        <span className='fcr-chatroom-mobile-participant-user-list-name-role-name'>{transI18n('chat.teacher')}</span>
                      </div>
                    }
                  </div>
                  <div className='options-container'>
                    <SvgImg
                      className='fcr-chatroom-mobile-participant-user-list-options-icon'
                      type={enableAudio ? SvgIconEnum.PARTICIPANT_AUDIO_STATUS_ENABLE : SvgIconEnum.PARTICIPANT_AUDIO_STATUS_DISABLE}
                      size={32} />
                    <SvgImg
                      className='fcr-chatroom-mobile-participant-user-list-options-icon'
                      type={enableVideo ? SvgIconEnum.PARTICIPANT_VIDEO_STATUS_ENABLE : SvgIconEnum.PARTICIPANT_VIDEO_STATUS_DISABLE}
                      size={32} />
                    {isTeacher && <SvgImg
                      className='fcr-chatroom-mobile-participant-user-list-options-icon'
                      type={SvgIconEnum.PARTICIPANT_USER_MORE}
                      size={32}
                      onClick={() => { setCureentOptionsUser(user) }} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {cureentOptionsUser && <ParticipantMoreDialog setIsShowMoreParticipant={(data) => { setCureentOptionsUser(data) }} user={cureentOptionsUser}></ParticipantMoreDialog>}
      </div>
    );
  },
);
export default ParticipantDialog;