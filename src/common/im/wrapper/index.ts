import { FcrChatRoomManager } from './agora-chat-room-manager';
import { AgoraIMBase, AgoraIMUserInfo, AgoraIMUserInfoExt } from './typs';

export class AgoraIM {

  //教室管理结合
  private static _roomImManager = new Map<string, FcrChatRoomManager>();
  //当前房间的私聊对象集合
  private static _roomCurrentPrivateManager = new Map<string, AgoraIMUserInfo>();

  static createIMwithType(
    type: 'easemob',
    opt: {
      appKey: string;
      roomId: string;
      userInfo: AgoraIMUserInfo<AgoraIMUserInfoExt>;
      ext: { roomUuid: string };
    },
  ): AgoraIMBase {
    switch (type) {
      case 'easemob':
        const classRoomId = opt.ext.roomUuid
        const optionsChatRoomId = opt.roomId
        if (AgoraIM._roomImManager.has(classRoomId)) {
          return AgoraIM._roomImManager.get(classRoomId)!!.createChat(optionsChatRoomId)
        } else {
          let manager = new FcrChatRoomManager(opt.appKey, opt.userInfo, classRoomId, optionsChatRoomId)
          window.imManager = manager
          AgoraIM._roomImManager.set(classRoomId, manager)
          return manager.createChat(optionsChatRoomId)
        }
    }
  }
  /**
   * 加人聊天室
   * @param roomId 教室ID
   * @param chatRoomId 聊天室id
   */
  static async joinChatRoom(roomId: string, chatRoomId: string, token: string) {
    if (AgoraIM._roomImManager.has(roomId)) {
      let manager = AgoraIM._roomImManager.get(roomId)!!
      await manager.joinChatRoom(chatRoomId, token)
    }
  }
  /**
   * 退出聊天室
   * @param roomId 教室ID
   * @param chatRoomId 聊天室id
   */
  static async leaveChatRoom(roomId: string, chatRoomId: string) {
    if (AgoraIM._roomImManager.has(roomId)) {
      let manager = AgoraIM._roomImManager.get(roomId)!!
      await manager.leaveChatRoom(chatRoomId)
      if (!manager.haveChatRoom()) {
        AgoraIM._roomImManager.delete(roomId)
      }
    }
  }
  /**
   * 设置当前房间的私聊对象
   */
  static setPrivateUser(roomId: string, user: AgoraIMUserInfo | undefined) {
    if (user !== undefined) {
      this._roomCurrentPrivateManager.set(roomId, user)
    } else {
      this._roomCurrentPrivateManager.delete(roomId)
    }
  }
  /**
   * 获取当前房间的私聊对象
   */
  static getRoomPrivateUser(roomId: string): AgoraIMUserInfo | undefined {
    if (this._roomCurrentPrivateManager.has(roomId)) {
      return this._roomCurrentPrivateManager.get(roomId)
    } else {
      return undefined
    }
  }
}
