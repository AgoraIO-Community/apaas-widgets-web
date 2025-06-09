import assign from 'lodash/assign';
import uniq from 'lodash/uniq';
import remove from 'lodash/remove';
import isArray from 'lodash/isArray';
import omit from 'lodash/omit';
import uniqBy from 'lodash/uniqBy';

import { CHAT_TABS_KEYS, MUTE_CONFIG, LOCAL_RETAIN_HISTORY_COUNT } from '../contants';


let defaultState = {
  propsData: {}, // props 值
  showChat: false, // 控制Chat
  isShowMiniIcon: true, // 控制最小化icon
  isLogin: false, // 登陆状态
  loginUser: '', // 当前登陆ID
  loginUserInfo: {}, // 当前登陆账号的用户属性
  room: {
    info: {}, // 聊天室详情
    roomUsers: [], // 成员列表
    announcement: '', // 聊天室公告
    muteList: [], // 禁言列表
    roomUsersInfo: {}, // 成员属性
    allMute: false, // 全局禁言
    isUserMute: false, // 单人是否禁言
    memberCount:0,//成员数量
  },
  memberCount: 0,
  sendRoomIds: [],
  recvRoomIds: [],
  messages: [], // 消息列表
  isTabKey: CHAT_TABS_KEYS.chat, // 当前选中的Tab
  showRed: false, // 不在聊天Tab消息提示
  announcementStatus: true, // 公告编辑状态
  showAnnouncementNotice: false, //公告更新提示
  isQuestion: false, //是否选中提问
  configUIVisible: {
    showInputBox: true, //是否显示输入UI
    memebers: true, // 成员 tab
    announcement: true, //公告 tab
    allMute: true, // 全体禁言按钮
    isFullSize: false, // 是否为自适应展示
    emoji: true, // 默认emoji 为 true
    inputBox: 'multiple', // 输入UI
    btnSend: true, // 是否暂时send按钮
    imgIcon: true, // 是否展示图片图标
    screenshotIcon: true, // 是否展示截图图标
  },
  agoraTokenConfig: {}, // token config
  presenceList: [], //订阅列表
};
const reducer = (state = defaultState, action) => {
  const { type, data } = action;
  switch (type) {
    case 'SAVE_PROPS_ACTION':
      return {
        ...state,
        propsData: data,
      };
    case 'IS_SHOW_CHAT':
      return {
        ...state,
        showChat: data,
      };
    case 'STATUS_ACTION':
      return {
        ...state,
        isLogin: data,
      };
    case 'USER_ACTION':
      return {
        ...state,
        loginUser: data,
      };
    case 'USER_INFO_ACTION':
      return {
        ...state,
        loginUserInfo: data,
      };
    case 'ROOM_INFO':
      return {
        ...state,
        room: {
          ...state.room,
          info: data,
        },
      };
    case 'ROOM_USERS': {
      let ary = [];
      let userInfo = state.room.roomUsersInfo;
      if (action.option === 'addMember') {
        ary = ary.concat(data, ...state.room.roomUsers);
      } else if (action.option === 'removeMember') {
        remove(state.room.roomUsers, (v) => {
          return v == data;
        });
        ary = state.room.roomUsers;
        userInfo = omit(userInfo, data);
      } else {
        ary = state.room.roomUsers.concat(data);
      }
      let newAry = uniq(ary);
      return {
        ...state,
        room: {
          ...state.room,
          roomUsers: newAry,
          roomUsersInfo: userInfo,
        },
      };
    }
    case 'ROOM_USERS_BATCH': {
      const { list } = data;

      let ary = Array.from(state.room.roomUsers);

      let userInfo = state.room.roomUsersInfo;

      list.forEach(({ type, user }) => {
        if (type === 'addMember') {
          if (!ary.includes(user)) {
            ary.unshift(user);
          }
        } else if (type === 'removeMember') {
          remove(ary, (v) => {
            return v == user;
          });

          userInfo = omit(userInfo, user);
        }
      });
      return {
        ...state,
        room: {
          ...state.room,
          roomUsers: ary,
          roomUsersInfo: userInfo,
        },
      };
    }
    case 'ROOM_USERS_COUNT':
      return {
        ...state,
        room: {
          ...state.room,
          memberCount: data,
        },
      };
    case 'ROOM_USERS_INFO':
      let newInfo = assign({}, state.room.roomUsersInfo, data);
      return {
        ...state,
        room: {
          ...state.room,
          roomUsersInfo: newInfo,
        },
      };
    case 'ROOM_ANNOUNCEMENT':
      return {
        ...state,
        room: {
          ...state.room,
          announcement: data,
        },
      };
    case 'SAVE_ROOM_MESSAGE':
      const { isHistory } = action.options;
      const mainRoomId = state.room.info.id
      const currUserId = state.propsData.userUuid
      const recvRoomIds = state.propsData.recvRoomIds
      let dataArray = data;

      if (!isArray(data)) {
        dataArray = [data];
      }

      let msgs;
      let newMsgs;
      msgs = state.messages.concat(dataArray);

      const msgIds = dataArray.filter((msg) => !!msg.ext.msgId).map((msg) => msg.ext.msgId);
      // 只显示自己发送的和接受组的消息
      msgs = msgs.filter((item) => ( item.from == currUserId || recvRoomIds.indexOf(item.to) !==-1) && !msgIds.includes(item.id));

      newMsgs = uniqBy(msgs, 'id');
      newMsgs = newMsgs.slice(newMsgs.length - LOCAL_RETAIN_HISTORY_COUNT, newMsgs.length).sort((a, b) => Number(a.time) - Number(b.time));
      return {
        ...state,
        messages: newMsgs,
      };
    case 'ROOM_ALL_MUTE':
      return {
        ...state,
        room: {
          ...state.room,
          allMute: data,
        },
      };
    case 'ROOM_USER_MUTE':
      let muteAry = [];
      let muteList = state.room.muteList;
      if (action.option === MUTE_CONFIG.mute) {
        muteAry = muteList.concat(data);
      } else if (action.option === MUTE_CONFIG.unMute) {
        muteAry = muteList.filter((item) => item !== data);
      } else {
        muteAry = data;
      }
      return {
        ...state,
        room: {
          ...state.room,
          muteList: muteAry,
        },
      };
    case 'IS_USER_MUTE':
      return {
        ...state,
        room: {
          ...state.room,
          isUserMute: data,
        },
      };
    case 'CLEAR_STORE':
      return assign({}, defaultState);
    case 'SELECT_TAB_ACTION':
      return {
        ...state,
        isTabKey: data,
      };
    case 'SHOW_RED_NOTIFICSTION':
      return {
        ...state,
        showRed: data,
      };
    case 'ANNOUNCEMENT_STATUS':
      return {
        ...state,
        announcementStatus: data,
      };

    case 'ANNOUNCEMENT_NOTICE':
      return {
        ...state,
        showAnnouncementNotice: data,
      };
    case 'MINI_ICON_STATUE':
      return {
        ...state,
        isShowMiniIcon: data,
      };
    case 'SET_VISIBLE_UI':
      return {
        ...state,
        configUIVisible: { ...state.configUIVisible, ...data },
      };
    case 'RESET_ACTION':
      return {
        ...state,
        ...defaultState,
      };
    case 'SET_APIS':
      return {
        ...state,
        apis: data,
      };
    case 'SET_QUESTION_STATE':
      return {
        ...state,
        isQuestion: data,
      };
    case 'SET_AGORATOKEN_CONFIG':
      return {
        ...state,
        agoraTokenConfig: data,
      };
    case 'USER_STATUS_ACTION':
      return {
        ...state,
        presenceList: data,
      };
    default:
      break;
  }
};

export default reducer;
