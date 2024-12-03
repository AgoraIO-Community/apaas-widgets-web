import { useContext } from 'react';
import { AgoraIMCmdActionEnum, AgoraIMUserInfo } from '../../../../../common/im/wrapper/typs';
import { FcrChatroomToastContext } from '../container/desktop';
import { useStore } from './useStore';

export const useMute = () => {
  const toast = useContext(FcrChatroomToastContext);
  const {
    userStore: { muteUserList, unmuteUserList },
    messageStore: { sendCustomMessage },
  } = useStore();
  const muteUser = async (user: AgoraIMUserInfo) => {
    await muteUserList([user.userId]);
    toast?.open({
      toastProps: {
        type: 'info',
        content: `${user.nickName} muted`,
        size: 'small',
      },
    });
    sendCustomMessage(AgoraIMCmdActionEnum.UserMuted, {
      muteMember: user.userId,
      muteNickName: user.nickName,
    });
  };
  const unmuteUser = async (user: AgoraIMUserInfo) => {
    await unmuteUserList([user.userId]);
    toast?.open({
      toastProps: {
        type: 'info',
        content: `${user.nickName} unmuted`,
        size: 'small',
      },
    });
    sendCustomMessage(AgoraIMCmdActionEnum.UserUnmuted, {
      muteMember: user.userId,
      muteNickName: user.nickName,
    });
  };
  return { muteUser, unmuteUser };
};
