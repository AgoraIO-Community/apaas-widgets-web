import { WebIM } from '../utils/WebIM';
import { messageAction } from '../redux/actions/messageAction';
import { ROLE, HISTORY_COUNT } from '../contants';
import {
  roomAllMute,
  roomUsersBatch,
  isUserMute,
  announcementNotice,
  roomUserMute,
} from '../redux/actions/roomAction';
import { uniq } from 'lodash';
const getHistoryMsgs = (options) => {
  return new Promise((resolve, reject) => {
    WebIM.conn.fetchHistoryMessages({
      ...options,
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      }
    });
  })
}
const batchGetHistoryMsgs = (roomIds, options) => {
  let tasks = []
  for(let roomId of uniq(roomIds)){
    const task = getHistoryMsgs({
      queue: roomId,
      ...options
    })
    tasks.push(task)
  }
  return Promise.all(tasks)
}

export class ChatHistoryAPI {
  store = null;
  constructor(store, messageAPI) {
    this.store = store;
    this.messageAPI = messageAPI;
  }

  getHistoryMessages = async () => {
    const state = this.store.getState();
    const apis = state.apis
    const currentLoginUser = state.propsData.userUuid;
    const recvRoomIds = state?.propsData.recvRoomIds;
    const roleType = state.propsData?.roleType;
    const isAdmins = roleType === ROLE.teacher.id || roleType === ROLE.assistant.id;
    const list = await batchGetHistoryMsgs(recvRoomIds, {
      isGroup: true,
      count: HISTORY_COUNT,
    })

    let allMsgs = []
    for(let item of list) {
      const historyMsg = item;
      let deleteMsgId = [];
      historyMsg.forEach((val) => {
        const {
          ext: { msgId },
        } = val;
        const { action, id } = val;
        if (action == 'DEL') {
          deleteMsgId.push(msgId);
          this.store.dispatch(messageAction(val, { showNotice: false, isHistory: true }));
        } else if (deleteMsgId.includes(id)) {
          return;
        } else {
          const newMessage = this.messageAPI.convertCustomMessage(val);
          this.store.dispatch(messageAction(newMessage, { showNotice: false, isHistory: true }));
        }
        allMsgs.push(val)
      });
    }

    const message = allMsgs.sort((a, b) => {
      return Number(a.time) - Number(b.time)
    }).findLast(msg => {
      return msg.action == "setAllMute" || msg.action == "removeAllMute"  || msg.action == "mute" || msg.action == "unmute"
    })
    if(message){
      switch (message.action) {
        case "setAllMute":
          this.store.dispatch(roomAllMute(true));
          break
        case "removeAllMute":
          this.store.dispatch(roomAllMute(false));
          break
        case "mute":
          if (currentLoginUser === message.ext.muteMember) {
            apis.muteAPI.setUserProperties();
            if (isAdmins) {
              this.store.dispatch(roomUserMute(message.ext.muteMember, MUTE_CONFIG.mute));
            }
            this.store.dispatch(isUserMute(true))
          }
          break
        case "unmute":
          if (currentLoginUser === message.ext.muteMember) {
            apis.muteAPI.removeUserProperties();
            if (isAdmins) {
              this.store.dispatch(roomUserMute(message.ext.muteMember, MUTE_CONFIG.unMute));
            }
            this.store.dispatch(isUserMute(false));
          }
          break
      }
    }
  };
}
