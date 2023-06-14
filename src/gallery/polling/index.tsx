import ReactDOM from 'react-dom';
import { AgoraEduToolWidget } from '../../common/edu-tool-widget';
import { Polling } from './app';
import { PollingUIContext, PollingUIContextValue } from './ui-context';
import { DialogWrapper } from './components/dialog-wrapper';
import { PollingResultInfo, PollingState, PollingType } from './type';
import { action, observable, runInAction } from 'mobx';
import { EduRoleTypeEnum } from 'agora-edu-core';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../events';
import { bound } from 'agora-common-libs';
import { SvgIconEnum } from '@components/svg-img';

export class FcrPollingWidget extends AgoraEduToolWidget {
  protected _listenerDisposer?: CallableFunction;
  private _dom?: HTMLElement;
  private _context: PollingUIContextValue = this._createUIContext();
  private _pollId?: string;
  private _width = 230;
  private _height = 405;

  get defaultRect() {
    const clientRect = document.body.getBoundingClientRect();
    return {
      width: this._width,
      height: this._height,
      x: clientRect.width / 2 - this._width / 2,
      y: clientRect.height / 2 - this._height / 2,
    };
  }
  get dragHandleClassName() {
    return 'fcr-polling-question';
  }
  get dragCancelClassName() {
    return 'fcr-drag-cancel';
  }
  get boundaryClassName() {
    return 'fcr-classroom-viewport';
  }

  get minWidth() {
    return 230;
  }

  get minHeight() {
    return 332;
  }

  render(dom: HTMLElement) {
    this._dom = dom;
    ReactDOM.render(
      <PollingUIContext.Provider value={this._context}>
        <DialogWrapper>
          <Polling />
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
    return this.isTeacher;
  }

  get isTeacher() {
    const { role } = this.classroomConfig.sessionInfo;
    return role === EduRoleTypeEnum.teacher;
  }

  get startedState() {
    return this.isTeacher ? PollingState.POLLING_END : PollingState.POLLING_SUBMIT;
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
    console.log('onUserPropertiesUpdate', userProperties);

    runInAction(() => {
      if (userProperties.pollId === this._pollId) {
        this._context.observables.selectIndex = userProperties?.selectIndex;
      }
    });
  }

  onPropertiesUpdate(properties: any) {
    console.log('onPropertiesUpdate', properties);
    this._updateContext(properties);
  }

  onDestroy() {
    this._setMinimize(false);
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
      isOwner: this.isTeacher,
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
      canClose: this.isTeacher,
    });

    const context = {
      observables,
      setActionLoading: action((loading: boolean) => {
        observables.isActionLoading = loading;
      }),

      create: async () => {
        const { roomUuid } = this.classroomConfig.sessionInfo;

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
          this.ui.addToast('Cannot create poll as something is wrong', 'error');
        } finally {
          context.setActionLoading(false);
        }
      },
      submit: async () => {
        const { roomUuid, userUuid } = this.classroomConfig.sessionInfo;

        context.setActionLoading(true);
        try {
          await this.classroomStore.api.submitResult(roomUuid, `${this._pollId}`, userUuid, {
            selectIndex: Array.from(observables.selectedOptions),
          });
        } catch (e) {
          this.ui.addToast('Cannot submit poll as something is wrong', 'error');
        } finally {
          context.setActionLoading(false);
        }
      },
      end: () => {
        const { roomUuid } = this.classroomConfig.sessionInfo;

        try {
          this.classroomStore.api.stopPolling(roomUuid, `${this._pollId}`);
        } catch (e) {
          this.ui.addToast('Cannot submit poll as something is wrong', 'error');
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
      onResize: this.handleResize,
      onClose: () => {
        this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
          widgetId: this.widgetId,
          visible: false,
        });
        setTimeout(() => {
          this.handleClose();
        }, 500);
      },
      onMinimize: this._setMinimize,
    };

    return context;
  }

  @bound
  private _setMinimize(minimized = true) {
    this._context.setMinimize(minimized);

    if (minimized) {
      this.broadcast(AgoraExtensionWidgetEvent.Minimize, {
        minimized: true,
        widgetId: this.widgetId,
        icon: SvgIconEnum.FCR_V2_VOTE,
        tooltip: 'Poll',
      });
    } else {
      this.broadcast(AgoraExtensionWidgetEvent.Minimize, {
        minimized: false,
        widgetId: this.widgetId,
      });
    }
  }
}
