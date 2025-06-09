import { WebIM } from '../utils/WebIM';
import { roomAllMute, roomUserMute, isUserMute } from '../redux/actions/roomAction';
import { SET_ALL_MUTE, REMOVE_ALL_MUTE, MUTE_USER, UNMUTE_USER, MUTE_CONFIG } from '../contants';
import http from './base';
import { EduRoleTypeEnum } from 'agora-edu-core';

const batchMuteRoom = (roomIds, muted) => {
  let tasks = []
  for(let roomId of roomIds){
    let task
    if(muted){
      task = WebIM.conn.disableSendChatRoomMsg({
        chatRoomId: roomId
      })
    }else{
      task = WebIM.conn.enableSendChatRoomMsg({
        chatRoomId: roomId
      })
    }
    
    tasks.push(task)
  }
  return Promise.all(tasks)
}

const batchMuteUser = (userId, roomIds, muted) => {
  let tasks = []
  for(let roomId of roomIds){
    let task
    if(muted){
      task = WebIM.conn.muteChatRoomMember({
        chatRoomId: roomId, // 聊天室id
        username: userId, // 成员id列表
        muteDuration: -1,
      })
    }else{
      
      task = WebIM.conn.unmuteChatRoomMember({
        chatRoomId: roomId, // 聊天室id
        username: userId, // 成员id列表
        muteDuration: -1,
      })
    }
    
    tasks.push(task)
  }
  return Promise.all(tasks)
}

export class MuteAPI {
  store = null;
  messageAPI = null;
  constructor(store, messageAPI) {
    this.store = store;
    this.messageAPI = messageAPI;
  }

  // 获取当前登陆用户禁言状态
  getCurrentUserStatus = async () => {
    const { host, appId, roomUuid, userUuid } = this.store.getState().agoraTokenConfig;
    const url = `${host}/edu/apps/${appId}/v2/rooms/${roomUuid}/users/${userUuid}`;
    try {
      const resp = await http.get(url);
      const { userProperties } = resp.data.data;
      if (userProperties?.flexProps?.mute) {
        this.store.dispatch(isUserMute(true));
      }
    } catch (err) {
      console.log('err>>>', err);
    }
  };

  // 禁言后，设置 properties
  setUserProperties = () => {
    const { host, appId, roomUuid, userUuid } = this.store.getState().agoraTokenConfig;
    const url = `${host}/edu/apps/${appId}/v2/rooms/${roomUuid}/users/properties/batch`;
    const requestData = {
      users: [
        {
          userUuid,
          properties: {
            mute: MUTE_CONFIG.mute,
          },
          cause: {
            mute: MUTE_USER,
          },
        },
      ],
    };
    http.put(url, {
      data: requestData,
    });
  };

  // 解除禁言后，删除 properties
  removeUserProperties = () => {
    const { host, appId, roomUuid, userUuid } = this.store.getState().agoraTokenConfig;
    const url = `${host}/edu/apps/${appId}/v2/rooms/${roomUuid}/users/properties/batch`;
    const requestData = {
      users: [
        {
          userUuid,
          properties: ['mute'],
          cause: {
            mute: UNMUTE_USER,
          },
        },
      ],
    };
    http.delete(url, {
      data: requestData,
    });
  };

  // 单人禁言
  setUserMute = (userId) => {
    this.messageAPI.sendCmdMsg(MUTE_USER, userId);
    this.store.dispatch(roomUserMute(userId, MUTE_CONFIG.mute));
  };

  // 移除个人禁言
  removeUserMute = (userId) => {
    this.messageAPI.sendCmdMsg(UNMUTE_USER, userId);
    this.store.dispatch(roomUserMute(userId, MUTE_CONFIG.unMute));
  };

  // 获取禁言列表
  getChatRoomMuteList = (roomId) => {
    const owner = this.store.getState()?.room.info.owner;
    let options = {
      chatRoomId: roomId, // 聊天室id
    };
    WebIM.conn.getChatRoomMuteList(options).then((res) => {
      console.log('getChatRoomMuteList success>>>', res);
      let newMuteList = [];
      res.data.map((item) => {
        if (item.user === owner) return;
        return newMuteList.push(item.user);
      });
      this.store.dispatch(roomUserMute(newMuteList));
    });
  };

  // 一键禁言
  setAllmute = async () => {
    const { roleType, chatRoomId, userRoomIds=[] } = this.store.getState().propsData

    // if(roleType == EduRoleTypeEnum.teacher){
    //   // 老师禁言主房间
    //   await batchMuteRoom([chatRoomId], true)
    // }else{
    //   // 助教禁言子房间
    //   await batchMuteRoom(userRoomIds, true)
    // }
    this.messageAPI.sendCmdMsg(SET_ALL_MUTE);
    this.store.dispatch(roomAllMute(true));
  };
  // 解除一键禁言
  removeAllmute = async () => {
    const { roleType, chatRoomId, userRoomIds=[] } = this.store.getState().propsData

    // if(roleType == EduRoleTypeEnum.teacher){
    //   // 老师禁言主房间
    //   await batchMuteRoom([chatRoomId], false)
    // }else{
    //   // 助教禁言子房间
    //   await batchMuteRoom(userRoomIds, false)
    // }
    this.messageAPI.sendCmdMsg(REMOVE_ALL_MUTE);
    this.store.dispatch(roomAllMute(false));
  
  };
}
