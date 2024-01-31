import { bound, Lodash, Scheduler, transI18n } from 'agora-common-libs';
import { observable, action, runInAction, computed, reaction } from 'mobx';
import { FcrChatroomWidget } from '../..';
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
import { List, CellMeasurerCache } from 'react-virtualized';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../../../events';
import dayjs from 'dayjs';
const MAX_MESSAGE_COUNT = 1000;
export class MessageStore {
  private _disposers: (() => void)[] = [];
  private _pollingMessageTask?: Scheduler.Task;
  private _messageQueue: AgoraIMMessageBase[] = [];
  private _messageListRef: List | null = null;
  private _messageGapTime = 5 * 60 * 1000;
  listCache = new CellMeasurerCache({
    // defaultWidth: 200,
    minHeight: 30,
    fixedWidth: true,
  });
  @observable currentChatTab: 'chat' | 'member' = 'chat';
  @action.bound
  setTab(tab: 'chat' | 'member') {
    this.currentChatTab = tab;
  }
  @observable historyMessageLoaded = false;

  @observable lastUnreadMessage: AgoraIMTextMessage | AgoraIMImageMessage | null = null;
  @action.bound
  setLastUnreadMessage(message: AgoraIMTextMessage | AgoraIMImageMessage) {
    this.lastUnreadMessage = message;
    this._widget.broadcast(AgoraExtensionWidgetEvent.ChatUnreadMessageUpdate, message);
  }

  @observable messageInputText = '';
  @action.bound
  setMessageInputText(text: string) {
    this.messageInputText = text;
  }

  @observable announcementInputText = '';
  @action.bound
  setAnnouncementInputText(text: string) {
    this.announcementInputText = text;
  }

  @observable showAnnouncementInput = false;
  @action.bound
  setShowAnnouncementInput(show: boolean) {
    this.showAnnouncementInput = show;
  }
  @observable showAnnouncement = false;
  @action.bound
  setShowAnnouncement(show: boolean) {
    this.showAnnouncement = show;
  }

  @observable isBottom = true;
  @observable unreadMessageCount = 0;
  @observable messageList: AgoraIMMessageBase[] = [];
  @observable announcement = '';
  constructor(private _widget: FcrChatroomWidget, private _fcrChatRoom: AgoraIMBase) {
    this._addEventListeners();
  }

  private async _addEventListeners() {
    this._fcrChatRoom.on(AgoraIMEvents.TextMessageReceived, this._onTextMessageReceived);
    this._fcrChatRoom.on(AgoraIMEvents.ImageMessageReceived, this._onImageMessageReceived);
    this._fcrChatRoom.on(AgoraIMEvents.CustomMessageReceived, this._onCustomMessageReceived);

    this._fcrChatRoom.on(AgoraIMEvents.AnnouncementUpdated, this._onAnnouncementUpdated);
    this._fcrChatRoom.on(AgoraIMEvents.AnnouncementDeleted, this._onAnnouncementDeleted);
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.PrivateChat,
      onMessage: this._handlePrivateChat,
    });
    this._disposers.push(
      reaction(
        () => this.announcement,
        (announcement) => {
          this.setShowAnnouncement(!!announcement);
          this.announcementInputText = announcement;
        },
      ),
    );
  }
  private async _removeEventListeners() {
    this._fcrChatRoom.off(AgoraIMEvents.TextMessageReceived, this._onTextMessageReceived);
    this._fcrChatRoom.off(AgoraIMEvents.ImageMessageReceived, this._onImageMessageReceived);
    this._fcrChatRoom.off(AgoraIMEvents.CustomMessageReceived, this._onCustomMessageReceived);

    this._fcrChatRoom.off(AgoraIMEvents.AnnouncementUpdated, this._onAnnouncementUpdated);
    this._fcrChatRoom.off(AgoraIMEvents.AnnouncementDeleted, this._onAnnouncementDeleted);

    this._disposers.forEach((d) => d());
    this._widget.removeBroadcastListener({
      messageType: AgoraExtensionRoomEvent.PrivateChat,
      onMessage: this._handlePrivateChat,
    });
  }

  @computed
  get renderableMessageList() {
    const combinedList: (AgoraIMMessageBase | AgoraIMMessageBase[] | string)[] = [];
    let lastTimestamp = 0;

    this.messageList.forEach((msg) => {
      const lastItem = combinedList[combinedList.length - 1];
      const timestamp = msg.ts || 0;
      const isToday = dayjs(timestamp).isSame(dayjs(), 'day');
      const isThisYear = dayjs(timestamp).isSame(dayjs(), 'year');
      const format = isToday ? 'HH:mm' : isThisYear ? 'MM-DD HH:mm' : 'YYYY-MM-DD HH:mm';

      if (msg.type === AgoraIMMessageType.Custom) {
        if (timestamp - lastTimestamp > this._messageGapTime) {
          combinedList.push(dayjs(timestamp).format(format));
        }
        combinedList.push(msg);
      } else {
        if (lastItem instanceof Array) {
          const prevMsg = lastItem[lastItem.length - 1];
          if (
            prevMsg.from === msg.from &&
            ((prevMsg.ext?.receiverList?.map((u) => u.userId).join('') ===
              msg.ext?.receiverList?.map((u) => u.userId).join('') &&
              this.checkIsPrivateMessage(prevMsg) &&
              this.checkIsPrivateMessage(msg)) ||
              (!this.checkIsPrivateMessage(prevMsg) && !this.checkIsPrivateMessage(msg)))
          ) {
            if (timestamp - lastTimestamp > this._messageGapTime) {
              combinedList.push(dayjs(timestamp).format(format));
              combinedList.push([msg]);
            } else {
              lastItem.push(msg);
            }
          } else {
            if (timestamp - lastTimestamp > this._messageGapTime) {
              combinedList.push(dayjs(timestamp).format(format));
            }
            combinedList.push([msg]);
          }
        } else {
          if (timestamp - lastTimestamp > this._messageGapTime) {
            combinedList.push(dayjs(timestamp).format(format));
          }
          combinedList.push([msg]);
        }
      }
      lastTimestamp = timestamp;
    });

    return combinedList;
  }
  checkIsPrivateMessage(message: AgoraIMMessageBase) {
    return message.ext && message.ext?.receiverList?.length > 0;
  }

  @action.bound
  private _handlePrivateChat() {
    this.setTab('chat');
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
            if (
              (msg.type === AgoraIMMessageType.Text || msg.type === AgoraIMMessageType.Image) &&
              msg.from !== this._fcrChatRoom.userInfo?.userId
            ) {
              this.setLastUnreadMessage(msg);
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
                  // if (msg.type === AgoraIMMessageType.Custom) {
                  //   const customMessage = msg as AgoraIMCustomMessage;
                  //   //如果是单个禁言消息
                  //   if (
                  //     customMessage.action === AgoraIMCmdActionEnum.UserMuted ||
                  //     customMessage.action === AgoraIMCmdActionEnum.UserUnmuted
                  //   ) {
                  //     //如果不是自己的单个禁言消息，过滤
                  //     if (customMessage.ext?.muteMember !== this._fcrChatRoom.userInfo?.userId) {
                  //       return false;
                  //     }
                  //   }
                  // }
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
  setMessageListRef(list: List) {
    this._messageListRef = list;
  }
  @bound
  @Lodash.debounced(100)
  messageListScrollToBottom() {
    if (this._messageListRef) {
      this._messageListRef?.scrollToRow(this.renderableMessageList.length);
    }
  }
  @action.bound
  addMessage(message: AgoraIMMessageBase) {
    this.messageList.push(message);
  }
  @action.bound
  removeAnnouncementFromMessageList() {
    this.messageList = this.messageList.filter((msg) => {
      return typeof msg !== 'string';
    });
  }

  @action.bound
  setIsBottom(isBottom: boolean) {
    if (isBottom) {
      this.unreadMessageCount = 0;
    }
    this.isBottom = isBottom;
  }
  @bound
  recomputedList() {
    this.listCache.clearAll();
    this._messageListRef?.recomputeRowHeights(this.renderableMessageList.length);
  }
  @bound
  reRenderMessageList() {
    this.recomputedList();
    if (this.isBottom) {
      this.messageListScrollToBottom();
    }
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
  async updateAnnouncement(announcement: string) {
    await this._fcrChatRoom.setAnnouncement(announcement);
    runInAction(() => {
      this.announcement = announcement;
    });
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
      this._messageQueue = this._messageQueue.concat(messages);
      this.historyMessageLoaded = true;
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
