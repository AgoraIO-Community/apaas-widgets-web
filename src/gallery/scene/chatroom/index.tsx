import {
  chatEmojiEnabled,
  chatMuteAllEnabled,
  chatPictureEnabled,
  FcrUISceneWidget,
} from 'agora-common-libs';
import type { AgoraWidgetController } from 'agora-edu-core';
import ReactDOM from 'react-dom';
import { FcrChatRoomApp } from './fcr-chatroom';
import { AgoraExtensionWidgetEvent } from '../../../events';
import { FcrChatRoomStore } from './fcr-chatroom/store';

export class FcrChatroomWidget extends FcrUISceneWidget {
  private _imConfig?: { chatRoomId: string; appName: string; orgName: string };
  private _easemobUserId?: string;
  private _dom?: HTMLElement;
  private _rendered = false;
  store: FcrChatRoomStore | null = null;
  slotDom?: HTMLElement;
  get dialogRenderDom() {
    return this._dom;
  }
  onInstall(controller: AgoraWidgetController): void {}
  get dragHandleClassName(): string {
    return 'fcr-chatroom-dialog-title';
  }
  private _width = 350;
  private _height = 600;
  get defaultRect() {
    const clientRect = document.body.getBoundingClientRect();
    return {
      width: this._width,
      height: this._height,
      x: clientRect.width - this._width - 20,
      y: clientRect.height - this._height - 60,
    };
  }
  get minimizable() {
    return false;
  }
  get closeable() {
    return false;
  }
  get widgetName(): string {
    return 'easemobIM';
  }
  get hasPrivilege() {
    return false;
  }

  get imUIConfig() {
    let visibleBtnSend = true;
    let visibleEmoji = true;
    let inputBoxStatus = undefined;
    let visibleMuteAll = true;
    let visibleScreenCapture = true;
    let imgIcon = true;

    if (!chatEmojiEnabled(this.uiConfig)) {
      visibleEmoji = false;
    }
    if (!chatMuteAllEnabled(this.uiConfig)) {
      visibleMuteAll = false;
    }
    if (!chatPictureEnabled(this.uiConfig)) {
      visibleScreenCapture = false;
      imgIcon = false;
    }

    if (this.classroomConfig.platform === 'H5') {
      visibleBtnSend = false;
      visibleEmoji = false;
      inputBoxStatus = 'inline';
    }

    return {
      visibleEmoji,
      visibleBtnSend,
      inputBoxStatus,
      visibleMuteAll,
      visibleScreenCapture,
      imgIcon,
    };
  }

  get imConfig() {
    return this._imConfig;
  }

  get easemobUserId() {
    return this._easemobUserId;
  }

  onCreate(properties: any, userProperties: any) {
    this._easemobUserId = userProperties?.userId;
    this._imConfig = properties?.extra;
    const appKey = this._imConfig?.orgName + '#' + this._imConfig?.appName;
    this.store = new FcrChatRoomStore(this, appKey, this._imConfig?.chatRoomId || '');
    this._renderApp();
  }

  onPropertiesUpdate(properties: any) {
    this._imConfig = properties.extra;
    this._renderApp();
  }

  onUserPropertiesUpdate(userProperties: any) {
    this._easemobUserId = userProperties.userId;
    this._renderApp();
  }

  onDestroy(): void {
    this.store?.destroy();
  }

  private _renderApp() {
    if (this.imConfig && this.easemobUserId && this._dom) {
      ReactDOM.render(<FcrChatRoomApp widget={this} />, this._dom);
      this._rendered = true;
    }
  }

  render(dom: HTMLElement): void {
    this._dom = dom;
    this._renderApp();
  }

  setVisible(visible: boolean) {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: visible,
    });
  }

  unload(): void {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }
  onUninstall(controller: AgoraWidgetController): void {}
}
