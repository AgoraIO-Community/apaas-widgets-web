import { WidgetModal } from '../../../components/modal';
import { Provider } from 'mobx-react';
import ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import App from './app';
import AppH5 from './mobile/app';

import { PluginStore } from './store';
import { AgoraEduToolWidget } from '../../../common/edu-tool-widget';
import { AgoraWidgetController, EduRoleTypeEnum, Platform } from 'agora-edu-core';
import { transI18n } from 'agora-common-libs';
import { ThemeProvider } from 'agora-common-libs';
import { addResource } from './i18n/config';
import { AgoraExtensionWidgetEvent } from '../../../events';

export class AgoraCountdown extends AgoraEduToolWidget {
  private _store?: PluginStore;
  @observable
  roomProperties: any = {};
  @observable
  userProperties: any = {};
  private _dom?: HTMLElement;

  get widgetName(): string {
    return 'countdownTimer';
  }

  get zContainer(): 0 | 10 {
    return 10;
  }

  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [EduRoleTypeEnum.teacher, EduRoleTypeEnum.assistant].includes(role);
  }

  get minWidth() {
    return 258;
  }
  get minHeight() {
    return 144;
  }

  onInstall(controller: AgoraWidgetController) {
    addResource();
    controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('widget_countdown.appName'),
      iconType: 'countdown',
    });
  }

  onUninstall(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, this.widgetName);
  }

  @action
  onCreate(properties: any, userProperties: any) {
    this._store = new PluginStore(this);
    this.roomProperties = properties;
    this.userProperties = userProperties;
    this._checkState(properties);
  }

  @action
  onPropertiesUpdate(properties: any) {
    this.roomProperties = properties;
    this._checkState(properties);
  }
  @action
  onUserPropertiesUpdate(userProperties: any) {
    this.userProperties = userProperties;
  }

  private _checkState(props: any) {
    const isStudent = EduRoleTypeEnum.student === this.classroomConfig.sessionInfo.role;
    if (props.extra?.state === 0 && isStudent) {
      this.setVisibility(false);
    } else {
      this.setVisibility(true);
    }
  }
  locate(): HTMLElement | null | undefined {
    const { platform } = this.classroomConfig;
    if (platform === Platform.H5)
      return document.querySelector('.fcr-countdown-mobile-widget') as HTMLElement;
  }
  render(dom: HTMLElement) {
    this._dom = dom;
    const { platform } = this.classroomConfig;

    ReactDOM.render(
      <Provider store={this._store}>
        <ThemeProvider value={this.theme}>
          {platform === Platform.H5 ? (
            <AppH5 widget={this} />
          ) : (
            <WidgetModal
              title={transI18n('widget_countdown.appName')}
              closable={this.controlled}
              onCancel={this.handleClose}
              onResize={this.handleResize}>
              <App widget={this} />
            </WidgetModal>
          )}
        </ThemeProvider>
      </Provider>,
      dom,
    );
  }

  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onDestroy() {
    if (this._store) {
      this._store.destroy();
    }
  }
}
