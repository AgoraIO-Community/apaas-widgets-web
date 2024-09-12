import { useStore } from '../../../../hooks/useStore';
import { SvgIconEnum, SvgImg } from '../../../../../../../../components/svg-img';
import './index.css';
import { observer } from 'mobx-react';
import { transI18n } from 'agora-common-libs';
import { Avatar } from '@components/avatar';
import { EduClassroomConfig, EduRoleTypeEnum, EduStream, RteRole2EduRole } from 'agora-edu-core';

const ParticipantMoreDialog = observer(
  ({ setIsShowMoreParticipant, user }: { setIsShowMoreParticipant: (arg0: EduStream | null) => void, user: EduStream }) => {
    const {
      fcrChatRoom,
      userStore: { setPrivateUser, findUserConfig },
      messageStore: { openChatDialog }
    } = useStore()
    const showUserName = user.fromUser.userName;
    const isTeacher = EduRoleTypeEnum.teacher === RteRole2EduRole(EduClassroomConfig.shared.sessionInfo.roomType, user.fromUser.role);

    //选择私聊
    const selectPrivate = () => {
      const list = findUserConfig(user); 
      if (list) { 
        setPrivateUser(list);
        openChatDialog(true);
      }
      setIsShowMoreParticipant(null);
    }
    //选择所有
    return (
      <div className="fcr-chatroom-mobile-participant-more">
        <div className='fcr-chatroom-mobile-participant-more-content'>
          <div className="title-container">
            <span className='icon'>
              <Avatar size={36} borderRadius='10px' textSize={14} nickName={showUserName} style={isTeacher ? { background: 'var(--head-4, #D2DB0E)' } : {}} ></Avatar>
            </span>
            <span className='title'>{showUserName}</span>
          </div>
          <div className='item-options' onClick={selectPrivate}>
            <span className='text'>{transI18n('fcr_participant_more_item_text_private_chat')}</span>
            <SvgImg
              type={SvgIconEnum.PARTICIPANT_MORE_OPTIONS_PRIVATE_CHAT}
              size={32}
            />
          </div>
          <div className='cancel' onClick={() => { setIsShowMoreParticipant(null) }}>{transI18n('chat.cancel')}</div>
        </div>
      </div>
    );
  },
);
export default ParticipantMoreDialog;