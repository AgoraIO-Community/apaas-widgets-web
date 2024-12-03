import { InputMsg } from './InputMsg';
import { ROLE } from '../../contants';
import { transI18n } from 'agora-common-libs';
import './index.css';
import { useShallowEqualSelector } from '../../utils';

const AllMute = () => {
  return (
    <div className="fcr-hx-input-box fcr-hx-all-mute">
      <span>{transI18n('chat.all_muted')}</span>
    </div>
  );
};

const UserMute = () => {
  return (
    <div className="fcr-hx-input-box fcr-hx-all-mute">
      <span>{transI18n('chat.single_muted')}</span>
    </div>
  );
};

export const InputBox = () => {
  const { showInputBox, roleType, isAllMute, isUserMute } = useShallowEqualSelector((state) => {
    return {
      showInputBox: state.configUIVisible.showInputBox,
      roleType: state?.propsData.roleType,
      isAllMute: state?.room.allMute,
      isUserMute: state?.room.isUserMute,
    };
  });
  const isTeacher = roleType === ROLE.teacher.id;
  const isAssistant = roleType === ROLE.assistant.id;
  const isObserver = roleType === ROLE.observer.id;

  return (
    <div className="fcr-hx-input-box">
      {showInputBox && (
        <>
          {!isObserver && !isAssistant && !isTeacher && isAllMute && <AllMute />}
          {!isObserver && !isAssistant && !isTeacher && !isAllMute && isUserMute && <UserMute />}
          {(isAssistant || isTeacher || (!isAllMute && !isUserMute)) && (
            <InputMsg allMutePermission={isTeacher || isAssistant} />
          )}
        </>
      )}
    </div>
  );
};
