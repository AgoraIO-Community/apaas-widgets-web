import { bound, Lodash, Scheduler, transI18n } from 'agora-common-libs';
import { observable, action, runInAction, reaction } from 'mobx';
import { AgoraHXChatWidget } from '../..';
import {
  AgoraIMBase,
  AgoraIMCmdActionEnum,
  AgoraIMCustomMessage,
  AgoraIMEvents,
  AgoraIMImageMessage,
  AgoraIMMessageBase,
  AgoraIMMessageType,
  AgoraIMTextMessage,
} from '../../../../../common/im/wrapper/typs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../../../events';
const MAX_MESSAGE_COUNT = 1000;
export class MessageStore {
  private _disposers: (() => void)[] = [];
  private _pollingMessageTask?: Scheduler.Task;
  private _messageQueue: AgoraIMMessageBase[] = [];
  private _messageListDom: HTMLDivElement | null = null;
  @observable isBottom = true;
  @observable unreadMessageCount = 0;
  @observable messageList: (AgoraIMMessageBase | string)[] = [];
  @observable announcement = '';
  @observable showAnnouncement = false;
  constructor(private _widget: AgoraHXChatWidget, private _fcrChatRoom: AgoraIMBase) {
    this._addEventListeners();
  }

  private async _addEventListeners() {
    this._fcrChatRoom.on(AgoraIMEvents.TextMessageReceived, this._onTextMessageReceived);
    this._fcrChatRoom.on(AgoraIMEvents.ImageMessageReceived, this._onImageMessageReceived);
    this._fcrChatRoom.on(AgoraIMEvents.CustomMessageReceived, this._onCustomMessageReceived);

    this._fcrChatRoom.on(AgoraIMEvents.AnnouncementUpdated, this._onAnnouncementUpdated);
    this._fcrChatRoom.on(AgoraIMEvents.AnnouncementDeleted, this._onAnnouncementDeleted);
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OrientationStatesChanged,
      onMessage: this.messageListScrollToBottom,
    });
  }
  private async _removeEventListeners() {
    this._fcrChatRoom.off(AgoraIMEvents.TextMessageReceived, this._onTextMessageReceived);
    this._fcrChatRoom.off(AgoraIMEvents.ImageMessageReceived, this._onImageMessageReceived);
    this._fcrChatRoom.off(AgoraIMEvents.CustomMessageReceived, this._onCustomMessageReceived);

    this._fcrChatRoom.off(AgoraIMEvents.AnnouncementUpdated, this._onAnnouncementUpdated);
    this._fcrChatRoom.off(AgoraIMEvents.AnnouncementDeleted, this._onAnnouncementDeleted);
    this._widget.removeBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OrientationStatesChanged,
      onMessage: this.messageListScrollToBottom,
    });
  }
  private _startPollingMessageTask() {
    if (!this._pollingMessageTask) {
      this._pollingMessageTask = Scheduler.shared.addIntervalTask(() => {
        if (this._messageQueue.length) {
          const deletedMessageIds = new Map();
          this._messageQueue.forEach((msg) => {
            if (
              msg.type === AgoraIMMessageType.Custom &&
              (msg as AgoraIMCustomMessage).action === AgoraIMCmdActionEnum.MsgDeleted
            ) {
              const deletedMessageId = (msg.ext as unknown as { msgId: string }).msgId;
              deletedMessageIds.set(deletedMessageId, true);
            }
          });
          runInAction(() => {
            this.messageList = this.messageList
              .concat(this._messageQueue)
              .filter((msg) => {
                if (typeof msg !== 'string') {
                  //过滤被删除消息
                  if (deletedMessageIds.has(msg.id)) return false;
                  //如果是自定义消息
                  if (msg.type === AgoraIMMessageType.Custom) {
                    const customMessage = msg as AgoraIMCustomMessage;
                    //如果是单个禁言消息
                    if (
                      customMessage.action === AgoraIMCmdActionEnum.UserMuted ||
                      customMessage.action === AgoraIMCmdActionEnum.UserUnmuted
                    ) {
                      //如果不是自己的单个禁言消息，过滤
                      if (customMessage.ext?.muteMember !== this._fcrChatRoom.userInfo?.userId) {
                        return false;
                      }
                    }
                  }
                }
                return true;
              })
              .slice(-MAX_MESSAGE_COUNT);
            if (!this.isBottom) this.unreadMessageCount += this._messageQueue.length;
          });
          this._messageQueue = [];
        } else {
          this._pollingMessageTask?.stop();
          this._pollingMessageTask = undefined;
        }
      }, 500);
    }
  }
  @bound
  setMessageListDom(dom: HTMLDivElement) {
    this._messageListDom = dom;
  }
  @bound
  @Lodash.debounced(100)
  messageListScrollToBottom() {
    if (this._messageListDom) {
      this._messageListDom.scrollTop = this._messageListDom.scrollHeight;
    }
  }
  @action.bound
  addMessage(message: AgoraIMMessageBase | string) {
    this.messageList.push(message);
  }
  @action.bound
  removeAnnouncementFromMessageList() {
    this.messageList = this.messageList.filter((msg) => {
      return typeof msg !== 'string';
    });
  }
  @action.bound
  setShowAnnouncement(show: boolean) {
    this.showAnnouncement = show;
  }
  @action.bound
  setIsBottom(isBottom: boolean) {
    if (isBottom) {
      this.unreadMessageCount = 0;
    }
    this.isBottom = isBottom;
  }
  @action.bound
  private _onTextMessageReceived(msg: AgoraIMTextMessage) {
    this._messageQueue.push(msg);
    this._startPollingMessageTask();
  }
  @action.bound
  private _onImageMessageReceived(msg: AgoraIMImageMessage) {
    this._messageQueue.push(msg);
    this._startPollingMessageTask();
  }
  @action.bound
  private _onCustomMessageReceived(msg: AgoraIMCustomMessage) {
    this._messageQueue.push(msg);
    this._startPollingMessageTask();
  }
  @action.bound
  private _onAnnouncementUpdated() {
    this.getAnnouncement();
  }
  @action.bound
  private _onAnnouncementDeleted() {
    this.announcement = '';
  }
  @bound
  async sendTextMessage(text: string) {
    const message = this._fcrChatRoom.createTextMessage(text);

    if (message.msg?.length > 300) {
      console.log(this._widget);

      this._widget.broadcast(AgoraExtensionWidgetEvent.AddSingletonToast, {
        desc: transI18n('chat.enter_content_is_too_long'),
        type: 'normal',
      });

      return;
    }

    await this._fcrChatRoom.sendMessage(message);
    runInAction(() => {
      message.from = this._fcrChatRoom.userInfo?.userId;
      this._messageQueue.push(message);
    });
    this._startPollingMessageTask();
  }
  @bound
  async sendImageMessage(file: File) {
    const message = await this._fcrChatRoom.createImageMessage({
      file,
    });
    await this._fcrChatRoom.sendMessage(message);
    runInAction(() => {
      message.from = this._fcrChatRoom.userInfo?.userId;
      this._messageQueue.push(message);
    });
    this._startPollingMessageTask();
  }
  @action.bound
  async getHistoryMessageList() {
    const messages = await this._fcrChatRoom.getHistoryMessageList({ msgId: -1 });
    runInAction(() => {
      this._messageQueue = this._messageQueue.concat(messages);
    });
    this._startPollingMessageTask();
  }
  async getAnnouncement() {
    const announcement = await this._fcrChatRoom.getAnnouncement();
    runInAction(() => {
      this.announcement = announcement;
    });
  }

  destroy() {
    this._removeEventListeners();
  }
}
