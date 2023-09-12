import ReactDOM from 'react-dom';
import { observable, action } from 'mobx';

import type { AgoraWidgetController } from 'agora-edu-core';

import { FcrUISceneWidget, bound, transI18n } from 'agora-common-libs';
import { AgoraExtensionWidgetEvent } from '../../../events';
import { FcrPopupQuizApp } from './app';
import { SvgIconEnum } from '@components/svg-img';
import { addResource } from './i18n/config';

export class FcrPopupQuizWidget extends FcrUISceneWidget {
  @observable
  roomProperties: any = {};
  @observable
  userProperties: any = {};

  studentInitializeSize = {
    width: 230,
    height: 172,
  };
  teacherInitializeSize = {
    width: 390,
    height: 306,
  };
  teacherInProgressSize = {
    width: 500,
    height: 525,
  };
  get quizInProgress() {
    return this.roomProperties.extra?.answerState === 1;
  }
  private _dom?: HTMLElement;
  private get _width() {
    return this.hasPrivilege
      ? this.quizInProgress
        ? this.teacherInProgressSize.width
        : this.teacherInitializeSize.width
      : this.studentInitializeSize.width;
  }
  private get _height() {
    return this.hasPrivilege
      ? this.quizInProgress
        ? this.teacherInProgressSize.height
        : this.teacherInitializeSize.height
      : this.studentInitializeSize.height;
  }

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
    return role === 1 || role === 3;
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
  async onInstall(controller: AgoraWidgetController) {
    await addResource();

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
