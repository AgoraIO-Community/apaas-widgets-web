import { AgoraIMCmdActionEnum, AgoraIMUserInfo } from '../../../../im/wrapper/typs';
import { useStore } from './useStore';

export const useMute = () => {
  const {
    userStore: { muteUserList, unmuteUserList },
    messageStore: { sendCustomMessage },
  } = useStore();
  const muteUser = async (user: AgoraIMUserInfo) => {
    await muteUserList([user.userId]);
    sendCustomMessage(AgoraIMCmdActionEnum.UserMuted, {
      muteMember: user.userId,
      muteNickName: user.nickName,
    });
  };
  const unmuteUser = async (user: AgoraIMUserInfo) => {
    await unmuteUserList([user.userId]);
    sendCustomMessage(AgoraIMCmdActionEnum.UserUnmuted, {
      muteMember: user.userId,
      muteNickName: user.nickName,
    });
  };
  return { muteUser, unmuteUser };
};
