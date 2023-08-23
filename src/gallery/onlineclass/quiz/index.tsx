import ReactDOM from 'react-dom';
import { observable, action } from 'mobx';

import type { AgoraWidgetController } from 'agora-edu-core';

import { AgoraOnlineclassWidget, bound, transI18n } from 'agora-common-libs';
import { AgoraExtensionWidgetEvent } from '../../../events';
import { FcrPopupQuizApp } from './app';
import { SvgIconEnum } from '@components/svg-img';
import { addResource } from './i18n/config';

export class FcrPopupQuizWidget extends AgoraOnlineclassWidget {
  @observable
  roomProperties: any = {};
  @observable
  userProperties: any = {};
  private _dom?: HTMLElement;
  private _width = this.hasPrivilege ? 500 : 230;
  private _height = this.hasPrivilege ? 315 : 172;

  get defaultRect() {
    const clientRect = document.body.getBoundingClientRect();
    return {
      width: this._width,
      height: this._height,
      x: this.isAudience ? 250 : clientRect.width / 2 - this._width / 2,
      y: this.isAudience ? 45 : clientRect.height / 2 - this._height / 2,
    };
  }
  get widgetName(): string {
    return 'popupQuiz';
  }

  get zContainer(): 0 | 10 {
    return 0;
  }
  get dragHandleClassName(): string {
    return 'fcr-popup-quiz-container-bg';
  }
  get dragCancelClassName(): string {
    return 'fcr-popup-quiz-student-select';
  }
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return role === 1;
  }

  get minimizedProperties() {
    return {
      minimizedTooltip: transI18n('fcr_popup_quiz'),
      minimizedIcon: SvgIconEnum.FCR_V2_ANSWER,
      minimizedKey: this.widgetId,
      minimizedCollapsed: false,
    };
  }
  get isAudience() {
    const { role } = this.classroomConfig.sessionInfo;
    return role === 0;
  }
  onInstall(controller: AgoraWidgetController) {
    addResource();

    controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('fcr_popup_quiz'),
      iconType: SvgIconEnum.FCR_V2_ANSWER,
    });
  }

  onUninstall(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, this.widgetName);
  }

  @action
  onCreate(properties: any, userProperties: any) {
    this.roomProperties = properties;
    this.userProperties = userProperties;
    this.setVisible(this.roomProperties?.extra?.answerState !== 2 || this.hasPrivilege);
  }

  @action
  onPropertiesUpdate(properties: any) {
    this.roomProperties = properties;
    this.setVisible(this.roomProperties?.extra?.answerState !== 2 || this.hasPrivilege);
  }
  @action
  onUserPropertiesUpdate(userProperties: any) {
    this.userProperties = userProperties;
  }

  render(dom: HTMLElement) {
    this._dom = dom;
    ReactDOM.render(<FcrPopupQuizApp widget={this}></FcrPopupQuizApp>, dom);
  }
  locate() {
    return null;
  }
  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  @bound
  handleClose() {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.WidgetBecomeInactive, this.widgetId);

    this.deleteWidget();
  }
  @bound
  setVisible(visible: boolean) {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: visible,
    });
  }
  onDestroy() {}
}
