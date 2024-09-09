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
  AgoraIMMessageExt,
  AgoraIMMessageType,
  AgoraIMTextMessage,
  AgoraIMUserInfo,
} from '../../../../../common/im/wrapper/typs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../../../events';
import { FcrChatRoomStore } from '.';
import dayjs from 'dayjs';
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
  @observable historyMessageLoaded = false;
  @observable isFullScreen = false;
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
  checkIsPrivateMessage(message: AgoraIMMessageBase) {
    return message.ext && message.ext?.receiverList?.length > 0;
  }

  @bound
  messageTimeFormat(message: AgoraIMMessageBase) {
    //message时间戳
    const msgTime = message?.ts;
    //今日
    let date = new Date(),
      year: number | string = date.getFullYear(), //获取完整的年份(4位)
      month: number | string = date.getMonth() + 1, //获取当前月份(0-11,0代表1月)
      strDate: number | string = date.getDate(); // 获取当前日(1-31)
    //message

    let msgYear: number | string = dayjs(msgTime)?.year(), //获取完整的年份(4位)
      msgMonth: number | string = dayjs(msgTime)?.month() + 1, //获取当前月份(0-11,0代表1月)
      msgDate: number | string = dayjs(msgTime)?.date(); // 获取当前日(1-31)

    const result = year == msgYear
      ? (month == msgMonth && strDate == msgDate)
        ? dayjs(msgTime).format('hh:mm A')
        : dayjs(msgTime).format('MM-DD hh:mm A')
      : dayjs(msgTime).format('YYYY-MM-DD hh:mm A');

    return result
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
  setIsFullScreen(value: boolean) {
    this.isFullScreen = value;
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
    this.removeAnnouncementFromMessageList();
  }
  @bound
  async sendTextMessage(text: string, receiverList?: AgoraIMUserInfo[]) {
    const message = this._fcrChatRoom.createTextMessage(text, receiverList);
    if (message.msg?.length > 300) {
      this._widget.ui.addToast(transI18n('fcr_chat_tips_message_too_long'), 'error');
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
  async sendCustomMessage(
    action: AgoraIMCmdActionEnum,
    ext?: Partial<AgoraIMMessageExt>,
    receiverList?: AgoraIMUserInfo[],
  ) {
    const message = this._fcrChatRoom.createCustomMessage(action, ext, receiverList);
    await this._fcrChatRoom.sendMessage(message);
    runInAction(() => {
      message.from = this._fcrChatRoom.userInfo?.userId;
      this._messageQueue.push(message);
    });
    this._startPollingMessageTask();
  }
  @bound
  async sendImageMessage(file: File, receiverList?: AgoraIMUserInfo[]) {
    const message = await this._fcrChatRoom.createImageMessage(
      {
        file,
      },
      receiverList,
    );
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
      this._messageQueue = [...messages];
      this.historyMessageLoaded = true;
    });
    this._startPollingMessageTask();
  }
  async getAnnouncement() {
    const announcement = await this._fcrChatRoom.getAnnouncement();
    runInAction(() => {
      this.announcement = announcement;
      this.removeAnnouncementFromMessageList();
      if (announcement) {
        this.addMessage(announcement);
      }
    });
  }

  destroy() {
    this._removeEventListeners();
  }
}
