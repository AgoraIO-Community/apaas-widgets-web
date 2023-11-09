import ReactDOM from 'react-dom';
import { Polling } from './app';
import { PollingUIContext, PollingUIContextValue } from './ui-context';
import { DialogWrapper } from './components/dialog-wrapper';
import { PollingResultInfo, PollingState, PollingType } from './type';
import { action, observable, runInAction } from 'mobx';
import type { AgoraWidgetController } from 'agora-edu-core';
import { transI18n, FcrUISceneWidget } from 'agora-common-libs';
import { SvgIconEnum } from '@components/svg-img';
import { addResource } from './i18n/config';
import { AgoraExtensionWidgetEvent } from '../../../events';

export class FcrPollingWidget extends FcrUISceneWidget {
  protected _listenerDisposer?: CallableFunction;
  private _dom?: HTMLElement;
  private _context: PollingUIContextValue = this._createUIContext();
  private _pollId?: string;
  private _width = 230;
  private _height = this.hasPrivilege ? 405 : 350;

  get defaultRect() {
    const clientRect = document.body.getBoundingClientRect();
    return {
      width: this._width,
      height: this._height,
      x: this.isAudience ? 10 : clientRect.width / 2 - this._width / 2,
      y: this.isAudience ? 45 : clientRect.height / 2 - this._height / 2,
    };
  }
  get minimizedProperties() {
    return {
      minimizedTooltip: transI18n('fcr_poll_title'),
      minimizedIcon: SvgIconEnum.FCR_V2_VOTE,
      minimizedKey: this.widgetId,
      minimizedCollapsed: false,
    };
  }
  get draggable() {
    return true;
  }
  get resizable() {
    return false;
  }
  get dragHandleClassName() {
    return 'fcr-polling-title';
  }
  get dragCancelClassName() {
    return 'fcr-drag-cancel';
  }
  get boundaryClassName() {
    return 'fcr-classroom-viewport';
  }

  onInstall(controller: AgoraWidgetController) {
    addResource();

    controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('fcr_poll_title'),
      iconType: SvgIconEnum.FCR_V2_VOTE,
    });
  }

  onUninstall(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, this.widgetName);
  }
  render(dom: HTMLElement) {
    this._dom = dom;
    ReactDOM.render(
      <PollingUIContext.Provider value={this._context}>
        <DialogWrapper>
          <Polling widget={this} />
        </DialogWrapper>
      </PollingUIContext.Provider>,
      this._dom,
    );
  }

  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  get widgetName() {
    return 'poll';
  }
  get hasPrivilege() {
    return this.isTeacher || this.isAssistant;
  }

  get isTeacher() {
    const { role } = this.classroomConfig.sessionInfo;
    return role === 1;
  }
  get isStudent() {
    const { role } = this.classroomConfig.sessionInfo;
    return role === 2;
  }
  get isAssistant() {
    const { role } = this.classroomConfig.sessionInfo;
    return role === 3;
  }
  get isAudience() {
    const { role } = this.classroomConfig.sessionInfo;
    return role === 0;
  }

  get startedState() {
    return this.hasPrivilege ? PollingState.POLLING_END : PollingState.POLLING_SUBMIT;
  }

  onCreate(properties: any, userProperties: any) {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: true,
    });

    this._updateContext(properties);
    runInAction(() => {
      if (userProperties.pollId === this._pollId) {
        this._context.observables.selectIndex = userProperties?.selectIndex;
      }
    });
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.PollActiveStateChanged, true);
  }

  onUserPropertiesUpdate(userProperties: any) {
    runInAction(() => {
      if (userProperties.pollId === this._pollId) {
        this._context.observables.selectIndex = userProperties?.selectIndex;
      }
    });
  }

  onPropertiesUpdate(properties: any) {
    this._updateContext(properties);
  }

  onDestroy() {
    this.setMinimize(false);
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.PollActiveStateChanged, false);

    if (this._listenerDisposer) {
      this._listenerDisposer();
    }
  }

  @action
  private _updateContext(properties: any) {
    if (properties.extra?.pollId) {
      const { mode, pollId, pollDetails, pollItems, pollState, pollTitle, userCount } =
        properties.extra;

      if (pollId) {
        this._pollId = pollId;
      }

      const { observables } = this._context;

      let total = 0;

      const optionList = Object.keys(pollDetails).map((index) => {
        const { num, percentage } = pollDetails[index] as { num: number; percentage: number };

        total += num;
        return {
          id: parseInt(index),
          content: pollItems[index] as string,
          selectCount: num,
          percent: percentage,
        };
      });

      observables.resultInfo = {
        isMuti: mode !== 1,
        question: pollTitle,
        optionList,
        total,
      };
      observables.userCount = userCount || 0;
      if (observables.pollingState !== PollingState.POLLING_SUBMIT_END) {
        switch (pollState) {
          case 0:
            observables.pollingState = PollingState.POLLING_SUBMIT_END;
            break;
          case 1:
            observables.pollingState = this.startedState;
            break;
          case 2:
            observables.pollingState = PollingState.POLLING_EDIT;
            break;
          default:
            throw new Error('invalid poll state');
        }
      }
    }
  }

  private _createUIContext() {
    const observables = observable({
      isActionLoading: false,
      pollingState: PollingState.POLLING_EDIT,
      pollingType: PollingType.SINGLE,
      isOwner: this.hasPrivilege,
      isAudience: this.isAudience,
      question: '',
      options: [
        { id: 1, content: '' },
        { id: 2, content: '' },
      ],
      selectedOptions: new Set<number>(),
      resultInfo: undefined as PollingResultInfo | undefined,
      minimize: false,
      selectIndex: null,
      userCount: 0,
      canClose: this.hasPrivilege,
    });

    const context = {
      observables,
      setActionLoading: action((loading: boolean) => {
        observables.isActionLoading = loading;
      }),

      create: async () => {
        const roomUuid = this.classroomStore.connectionStore.sceneId;

        context.setActionLoading(true);
        try {
          runInAction(() => {
            observables.resultInfo = {
              question: observables.question,
              isMuti: observables.pollingType === PollingType.MULTI,
              optionList: [],
              total: 0,
            };
          });
          await this.classroomStore.api.startPolling(roomUuid, {
            mode: observables.pollingType === PollingType.SINGLE ? 1 : 2,
            pollItems: observables.options.map(({ content }) => content),
            pollTitle: observables.question,
            position: { xaxis: 0.5, yaxis: 0.5 },
          });
          runInAction(() => {
            observables.pollingState = PollingState.POLLING_END;
          });
        } catch (e) {
          this.ui.addToast(transI18n('fcr_poll_something_wrong'), 'error');
        } finally {
          context.setActionLoading(false);
        }
      },
      submit: async () => {
        const roomUuid = this.classroomStore.connectionStore.sceneId;
        const { userUuid } = this.classroomConfig.sessionInfo;

        context.setActionLoading(true);
        try {
          await this.classroomStore.api.submitResult(roomUuid, `${this._pollId}`, userUuid, {
            selectIndex: Array.from(observables.selectedOptions),
          });
        } catch (e) {
          this.ui.addToast(transI18n('fcr_poll_something_wrong'), 'error');
        } finally {
          context.setActionLoading(false);
        }
      },
      end: () => {
        const roomUuid = this.classroomStore.connectionStore.sceneId;

        try {
          this.classroomStore.api.stopPolling(roomUuid, `${this._pollId}`);
        } catch (e) {
          this.ui.addToast(transI18n('fcr_poll_something_wrong'), 'error');
        }
      },
      setMinimize: action((minimize: boolean) => {
        observables.minimize = minimize;
      }),
      setPollingState: action((state: PollingState) => {
        observables.pollingState = state;
      }),
      setPollingType: action((type: PollingType) => {
        observables.pollingType = type;
      }),
      setQuestion: action((question: string) => {
        observables.question = question;
      }),
      addOption: action(() => {
        observables.options.push({ id: Date.now(), content: '' });
      }),
      removeOption: action((id: number) => {
        observables.options = observables.options.filter((option) => option.id !== id);
      }),
      updateOption: action((id: number, content: string) => {
        observables.options.forEach((option) => {
          if (option.id === id) {
            option.content = content;
          }
        });
      }),
      setSelectedOptions: action((selections: Set<number>) => {
        observables.selectedOptions = selections;
      }),
      onClose: () => {
        this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
          widgetId: this.widgetId,
          visible: false,
        });
        this.handleClose();
      },
      onMinimize: this.setMinimize,
    };

    return context;
  }
  handleClose() {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.WidgetBecomeInactive, this.widgetId);

    this.deleteWidget();
  }
}
