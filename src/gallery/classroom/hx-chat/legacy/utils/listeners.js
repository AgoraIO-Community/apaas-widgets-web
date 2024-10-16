import { transI18n } from 'agora-common-libs';
import { statusAction, clearStore } from '../redux/actions/userAction';
import { messageAction, showRedNotification } from '../redux/actions/messageAction';
import {
  roomAllMute,
  roomUsersBatch,
  isUserMute,
  announcementNotice,
  roomUserMute,
} from '../redux/actions/roomAction';
import throttle from 'lodash/throttle';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import { message } from 'antd';
import { CHAT_TABS_KEYS, MUTE_CONFIG } from '../contants';
import { WebIM } from './WebIM';
import { ROLE, TEXT_MESSAGE_THROTTLE_TIME_MS, MEMBER_LIST_THROTTLE_TIME_MS } from '../contants';

export const createListener = (store) => {
  let messageFromArr = [];
  let intervalId;
  let messageArr = [];
  let memberInOut = [];

  const createListen = (new_IM_Data, appkey) => {
    const { apis } = store.getState();

    const dispatchMessageAction = throttle(() => {
      const temp = [...messageArr];
      messageArr = [];
      store.dispatch(messageAction(temp, { isHistory: false }));
      const showChat = store.getState().showChat;
      const isShowRed = store.getState().isTabKey !== CHAT_TABS_KEYS.chat;

      const showRedChanged = store.getState().showRed !== isShowRed;

      if (showRedChanged) {
        store.dispatch(showRedNotification(isShowRed));
      }

      if (!showChat && showRedChanged) {
        store.dispatch(showRedNotification(true));
      }
    }, TEXT_MESSAGE_THROTTLE_TIME_MS);

    const dispatchRoomUserAction = throttle(() => {
      console.log('[chat] execute member list batch', memberInOut);

      store.dispatch(roomUsersBatch(memberInOut));

      memberInOut = [];
    }, MEMBER_LIST_THROTTLE_TIME_MS);

    const listener = {
      onOpened: () => {
        console.log('onOpened>>>', store.getState());
        store.dispatch(statusAction(true));
        // message.success(transI18n('chat.login_success'));
        apis.userInfoAPI.setUserInfo(new_IM_Data);
        apis.chatRoomAPI.joinRoom(new_IM_Data);
      },
      onClosed: () => {
        console.log('onClosed>>>');
        store.dispatch(statusAction(false));
        store.dispatch(clearStore({}));
      },
      onOnline: (network) => {
        console.log('onOnline>>>', network);
      },
      onOffline: (network) => {
        console.log('onOffline>>>', network);
      },
      onError: (err) => {
        console.log('onError>>>', err);
        if (err.type === 16) {
          return message.error(transI18n('chat.login_again'));
        }
        if (err.type === 604) return;
      },
      onTextMessage: (message) => {
        console.log('onTextMessage>>>', message);
        const startTs = Date.now();
        if (new_IM_Data.chatRoomId === message.to) {
          const newMessage = apis.messageAPI.convertCustomMessage(message);
          messageArr.push(newMessage);
          dispatchMessageAction();
        }
        const endTs = Date.now();
        console.log('SAVE_ROOM_MESSAGE time:', endTs - startTs);
      },
      onPictureMessage: (message) => {
        console.log('onPictureMessage>>>', message);
        if (new_IM_Data.chatRoomId === message.to) {
          const showChat = store.getState().showChat;
          const isShowRed = store.getState().isTabKey !== CHAT_TABS_KEYS.chat;
          store.dispatch(showRedNotification(isShowRed));
          store.dispatch(messageAction(message, { isHistory: false }));
          if (!showChat) {
            store.dispatch(showRedNotification(true));
          }
        }
      },
      onCmdMessage: (message) => {
        console.log('onCmdMessaeg>>>', message);
        if (new_IM_Data.chatRoomId === message.to) {
          store.dispatch(
            messageAction(message, {
              showNotice: store.getState().isTabKey !== CHAT_TABS_KEYS.chat,
              isHistory: false,
            }),
          );
          const showChat = store.getState().showChat;
          const isShowRed = store.getState().isTabKey !== CHAT_TABS_KEYS.chat;
          store.dispatch(showRedNotification(isShowRed));
          if (!showChat) {
            store.dispatch(showRedNotification(true));
          }
        }
      },
      onPresence: (message) => {
        console.log('onPresence>>>', message);
        const activeTabKey = store.getState().isTabKey !== CHAT_TABS_KEYS.notice;
        const roleType = store.getState().propsData?.roleType;
        const isAdmins = roleType === ROLE.teacher.id || roleType === ROLE.assistant.id;
        if (new_IM_Data.chatRoomId !== message.gid) return;
        const roomUserList = get(store.getState(), 'room.roomUsers');
        const showChat = store.getState().showChat;
        const currentLoginUser = store.getState().propsData.userUuid;
        switch (message.type) {
          case 'memberJoinChatRoomSuccess':
            if (!isAdmins) return;
            if (message.from === '系统管理员') return;
            messageFromArr.push(message.from);
            intervalId && clearInterval(intervalId);
            intervalId = setTimeout(() => {
              let users = cloneDeep(messageFromArr);
              messageFromArr = [];
              apis.userInfoAPI.getUserInfo({ member: users });
            }, 500);

            if (!roomUserList.includes(message.from)) {
              memberInOut.push({ type: 'addMember', user: message.from });

              console.log('[chat] member in', memberInOut);

              dispatchRoomUserAction();
            }
            break;
          case 'leaveChatRoom':
            // 成员数 - 1
            // 移除成员
            memberInOut.push({ type: 'removeMember', user: message.from });

            console.log('[chat] member out', memberInOut);

            dispatchRoomUserAction();
            break;
          case 'updateAnnouncement':
            apis.chatRoomAPI.getAnnouncement(message.gid);
            store.dispatch(announcementNotice(activeTabKey));
            if (!showChat) {
              store.dispatch(showRedNotification(true));
            }
            break;
          case 'deleteAnnouncement':
            apis.chatRoomAPI.getAnnouncement(message.gid);
            store.dispatch(announcementNotice(activeTabKey));
            if (!showChat) {
              store.dispatch(showRedNotification(true));
            }
            break;
          case 'muteChatRoom':
            store.dispatch(roomAllMute(true));
            break;
          case 'rmChatRoomMute':
            store.dispatch(roomAllMute(false));
            break;
          // 移除个人禁言
          case 'removeMute':
            if (currentLoginUser === message.to) {
              apis.muteAPI.removeUserProperties();
            }
            if (isAdmins) {
              store.dispatch(roomUserMute(message.to, MUTE_CONFIG.unMute));
            }
            store.dispatch(isUserMute(false));
            break;
          // 添加个人禁言
          case 'addMute':
            if (currentLoginUser === message.to) {
              apis.muteAPI.setUserProperties();
            }
            if (isAdmins) {
              store.dispatch(roomUserMute(message.to, MUTE_CONFIG.mute));
            }
            store.dispatch(isUserMute(true));
            break;
          default:
            break;
        }
      },
      onPresenceStatusChange: (message) => {
        // 移除成员
        message.forEach((item) => {
          if (!item.statusDetails.length) {
            memberInOut.push({ type: 'removeMember', user: item.userId });

            dispatchRoomUserAction();
          }
        });
      },
    };

    WebIM.conn.listen(listener);
  };

  return { createListen };
};
