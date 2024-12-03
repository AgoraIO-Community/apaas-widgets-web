import { message } from 'antd';
import { Logger, transI18n } from 'agora-common-libs';
import { ROLE } from '../contants';
import {
  announcementStatus,
  recvRoomIds,
  roomAllMute,
  roomAnnouncement,
  roomInfo,
  roomUsers,
  sendRoomIds,
} from '../redux/actions/roomAction';
import { WebIM } from '../utils/WebIM';
import http from './base';
import { uniq } from 'lodash';
const joinRoom = (roomId) => {
  return WebIM.conn.joinChatRoom({
    roomId: roomId,
    message: 'reason'
  })
}

const batchJoinRoom = (roomIds) => {
  let tasks = []
  console.log("joinRoom>>>", uniq(roomIds))
  for(let roomId of uniq(roomIds)) {
    const task = joinRoom(roomId)
    tasks.push(task)
  }
  return Promise.all(tasks)
}

const batchGetRoomInfo = (roomIds) => {
  let tasks = []
  for(let roomId of uniq(roomIds)){
    const task = WebIM.conn.getChatRoomDetails({
      chatRoomId: roomId, // 聊天室id
    }).then(res => res.data[0])
    tasks.push(task)
  }
  return Promise.all(tasks)
}
export class ChatRoomAPI {
  store = null;
  chatHistoryAPI = null;
  muteAPI = null;
  userInfoAPI = null;
  presenceAPI = null;
  constructor(store, chatHistoryAPI, muteAPI, userInfoAPI, presenceAPI) {
    this.store = store;
    this.chatHistoryAPI = chatHistoryAPI;
    this.muteAPI = muteAPI;
    this.userInfoAPI = userInfoAPI;
    this.presenceAPI = presenceAPI;
  }

  // 加入聊天室
  joinRoom = async (params) => {
    const { chatRoomId: mainRoomId, sendRoomIds=[], recvRoomIds=[], userUuid, roleType } = params
    WebIM.conn.mr_cache = [];

    const roomIds = [mainRoomId, ...sendRoomIds, ...recvRoomIds]
    await batchJoinRoom(roomIds)
    // message.success(transI18n('chat.join_room_success'));
    const [mainRoomInfo] = await batchGetRoomInfo(roomIds)

    // 房间信息用主房间的
    this.store.dispatch(roomInfo(mainRoomInfo));
    // 主房间禁言其他房间也禁言
    if (mainRoomInfo.mute) {
      this.store.dispatch(roomAllMute(true));
    }

    // 主房间理论上包含所有成员
    let newArr = [];
    mainRoomInfo.affiliations.map((item) => {
      if (item.owner) {
        return;
      } else {
        newArr.push(item.member);
      }
    });
    // 保存主房间所有用户
    this.store.dispatch(roomUsers(newArr));
 
    this.userInfoAPI.getUserInfo({ member: newArr });
    this.getAnnouncement(mainRoomId);
    if (roleType === ROLE.teacher.id || roleType === ROLE.assistant.id) {
      this.muteAPI.getChatRoomMuteList(mainRoomId);
    }
    // 学生登陆 加入聊天室成功后，检查自己是否被禁言
    if (roleType === ROLE.student.id) {
      this.muteAPI.getCurrentUserStatus();
    }
    if (roleType === ROLE.teacher.id || roleType === ROLE.assistant.id) {
      this.getRoomsAdmin(mainRoomId);
    }
    this.chatHistoryAPI.getHistoryMessages();
  };


  // 获取群管理员
  getRoomsAdmin = (roomId) => {
    let option = {
      chatRoomId: roomId,
    };
    WebIM.conn.getChatRoomAdmin(option).then((res) => {
      const { data } = res;
      const currentLoginUser = WebIM.conn.context.userId;
      const admins = data.filter((item) => item !== currentLoginUser);
      this.presenceAPI.subscribePresence(admins);
    });
  };

  // 获取群组公告
  getAnnouncement = (roomId) => {
    let options = {
      roomId, // 聊天室id
    };
    WebIM.conn
      .fetchChatRoomAnnouncement(options)
      .then((res) => {
        this.store.dispatch(roomAnnouncement(res.data.announcement));
      })
      .catch((err) => {
        message.error(transI18n('chat.get_room_announcement'));
        console.log('getAnnouncement>>>', err);
      });
  };

  // 上传/修改 群组公告
  updateAnnouncement = (roomId, noticeCentent, callback) => {
    if (noticeCentent.length > 500) {
      return message.error(transI18n('chat.announcement_content'));
    }
    let options = {
      roomId: roomId, // 聊天室id
      announcement: noticeCentent, // 公告内容
    };
    WebIM.conn
      .updateChatRoomAnnouncement(options)
      .then((res) => {
        this.getAnnouncement(res.data.id);
        this.store.dispatch(announcementStatus(true));
        callback && callback();
      })
      .catch((err) => {
        message.error(transI18n('chat.update_room_announcement'));
        console.log('updateAnnouncement>>>', err);
      });
  };


  getRoomUserList = async (params) => {
    const { host, appId, roomUuid } = this.store.getState().agoraTokenConfig;
    const url = `${host}/edu/apps/${appId}/v2/rooms/${roomUuid}/users/page`;
    try {
      const resp = await http.get(url, {
        params
      });
      
    } catch (err) {
      console.log('err>>>', err);
    }
  }




  // 退出聊天室
  logoutChatroom = () => {
    const roomId = this.store.getState().propsData.chatRoomId;
    if (!WebIM.conn) {
      return;
    }
    if (WebIM.conn.token) {
      WebIM.conn.quitChatRoom({
        roomId: roomId, // 聊天室id
        success: function (res) {
          console.log('quitChatRoom_Success>>>', res);
          WebIM.conn.close();
        },
        error: function (err) {
          console.log('quitChatRoom_Error>>>', err);
          WebIM.conn.close();
        },
      });
    }
  };
}
