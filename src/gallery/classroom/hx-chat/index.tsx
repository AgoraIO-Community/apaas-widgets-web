import {
  chatEmojiEnabled,
  chatMuteAllEnabled,
  chatPictureEnabled,
  AgoraCloudClassWidget,
} from 'agora-common-libs';
import type { AgoraWidgetController } from 'agora-edu-core';
import classNames from 'classnames';

import ReactDOM from 'react-dom';
import { WidgetChatUIStore } from './store';
import { FcrChatRoomApp } from './fcr-chatroom';

export class AgoraHXChatWidget extends AgoraCloudClassWidget {
  private _imConfig?: { chatRoomId: string; appName: string; orgName: string };
  private _easemobUserId?: string;
  private _dom?: HTMLElement;
  private _widgetStore = new WidgetChatUIStore(this);
  private _rendered = false;

  onInstall(controller: AgoraWidgetController): void {}

  get widgetName(): string {
    return 'easemobIM';
  }
  get hasPrivilege() {
    return false;
  }

  get imConfig() {
    return this._imConfig;
  }

  get easemobUserId() {
    return this._easemobUserId;
  }

  get widgetStore() {
    return this._widgetStore;
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
    return document.querySelector('.widget-slot-chat-mobile') as HTMLElement;
  }

  render(dom: HTMLElement): void {
    this._dom = dom;

    const cls = classNames('fcr-h-full');

    this._dom.className = cls;

    this._renderApp();
  }

  setHide(hide: boolean) {
    const dom = this._dom;
    if (dom) {
      if (hide) {
        dom.classList.add('fcr-min-w-0');
      } else {
        dom.classList.remove('fcr-min-w-0');
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
