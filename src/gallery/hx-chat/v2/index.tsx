import { chatEmojiEnabled, chatMuteAllEnabled, chatPictureEnabled } from 'agora-common-libs/lib/ui';
import { AgoraWidgetController, Platform } from 'agora-edu-core';
import ReactDOM from 'react-dom';
import { FcrChatRoomApp } from './fcr-chatroom';
import { AgoraWidgetBase, AgoraWidgetLifecycle } from 'agora-common-libs/lib/widget';

export class AgoraHXChatWidget extends AgoraWidgetBase implements AgoraWidgetLifecycle {
  private _imConfig?: { chatRoomId: string; appName: string; orgName: string };
  private _easemobUserId?: string;
  private _dom?: HTMLElement;
  private _rendered = false;

  onInstall(controller: AgoraWidgetController): void {}

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

    if (this.classroomConfig.platform === Platform.H5) {
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

  onDestroy(): void {}

  private _renderApp() {
    if (!this._rendered && this.imConfig && this.easemobUserId && this._dom) {
      ReactDOM.render(<FcrChatRoomApp widget={this} />, this._dom);
      this._rendered = true;
    }
  }

  locate() {
    const { platform } = this.classroomConfig;
    if (platform === Platform.H5) {
      return document.querySelector('.widget-slot-chat-mobile') as HTMLElement;
    } else {
      return document.querySelector('#fcr-chatroom-slot') as HTMLElement;
    }
  }

  render(dom: HTMLElement): void {
    this._dom = dom;
    this._renderApp();
  }

  setHide(hide: boolean) {
    const dom = this._dom;
    if (dom) {
      if (hide) {
        dom.classList.add('min-w-0');
      } else {
        dom.classList.remove('min-w-0');
      }
    }
  }

  unload(): void {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onUninstall(controller: AgoraWidgetController): void {}
}
