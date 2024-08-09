import ReactDOM from 'react-dom';
import { App } from './app';
import type { AgoraWidgetController } from 'agora-edu-core';
import { FcrUISceneWidget, bound, transI18n } from 'agora-common-libs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { SvgIconEnum } from '@components/svg-img';
import { addResource } from './i18n/config';
import { fcrRttManager } from '../../../common/rtt/rtt-manager'
import { observable,runInAction } from 'mobx';
import { FcrRttItem } from 'src/common/rtt/rtt-item';

export class FcrRttboxWidget extends FcrUISceneWidget {
  private static _installationDisposer?: CallableFunction;
  private _dom?: HTMLElement;
  private _privilege = false;
  get zContainer(): 0 | 10 {
    return 10;
  }
  get widgetName() {
    return 'rttbox';
  }
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [1, 3].includes(role) || this._privilege;
  }
  get dragHandleClassName(): string {
    return 'fcr-rtt-box-widget-container';
  }
  get draggable(): boolean {
    return true;
  }
  get resizable(): boolean {
    return true;
  }
  get defaultRect(): { x: number; y: number; width: number; height: number } {
    const clientRect = document.body.getBoundingClientRect();
    return {
      width: this.defaultWidth,
      height: this.defaultHeight,
      x: clientRect.width - this.defaultWidth - 20,
      y: clientRect.height / 2 - this.defaultHeight / 2,
    };
  }

  defaultWidth = 320;
  defaultHeight = 600;
  get minimizedProperties() {
    
    return {
      minimized:true,
      minimizedTooltip: transI18n('fcr_rtt_tips_title'),
      minimizedIcon: SvgIconEnum.FCR_V2_RTT,
      minimizedKey: this.widgetId,
      minimizedCollapsed: false
    };
    
   
  }
  async onInstall(controller: AgoraWidgetController) {
    await addResource();
    this.registerWidget(controller)
  }
  onPropertiesUpdate(properties: any): void {
    // 获取下发数据
    console.log("更新数据了",properties)
    
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.ChangeRttlanguage, {
      widgetId: this.widgetId,
      message: properties,
    });
  }
  @bound
  onCreate(properties: any) {
    this.setVisible(true);
    this.registerWidget(this.widgetController)
    this.widgetController.addBroadcastListener( {
      messageType: AgoraExtensionRoomEvent.ToolboxChanged,
      onMessage: () => {
        this.registerWidget(this.widgetController)
      }
    })
    this.addRttListener()
  }
  @bound
  setVisible(visible: boolean) {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: visible,
    });
  }
  @bound
  private _handleGranted(grantedUsers: Set<string>) {
    const { userUuid } = this.classroomConfig.sessionInfo;

    this._privilege = grantedUsers.has(userUuid);
  }

  render(dom: HTMLElement) {
    this._dom = dom;
    ReactDOM.render(<App widget={this} />, dom);
    //动态添加设置按钮，需要延迟一定时间，让界面先渲染下
    setTimeout(() => {
      this.widgetController.broadcast(AgoraExtensionRoomEvent.RttShowSetting, { targetClsName: "fcr_rtt_settings_show", buttonView: <button className="settings-button">{transI18n('fcr_rtt_settings')} <span className="settings-button-arrow-down"></span></button> })
    }, 200);
  }
  @bound
  clsoe() {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.WidgetBecomeInactive, this.widgetId);
    this.deleteWidget();
  }
  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onDestroy() {
    this.clearBrocastListener()
    this.unRegisterWidget(this.widgetController)
  }

  onUninstall(controller: AgoraWidgetController) {
    if (FcrRttboxWidget._installationDisposer) {
      FcrRttboxWidget._installationDisposer();
    }
  }
  clearBrocastListener(){
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttReduceTimeChange,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttOptionsChanged,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttListChange,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.ReceiveTranscribeOpen,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttConversionOpenSuccess,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttConversionCloseSuccess,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttShowConversion,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttCloseSubtitle,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttContentChange,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttStateToNoSpeack,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttShowSetting,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttboxChanged,onMessage() {},})
    this.widgetController.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttBoxshow,onMessage() {},})
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.ToolboxChanged, onMessage() { }, })
  }
  //根据搜索条件获取结果列表
  getSearchResultList(searchQuery: string) {
    if (!searchQuery || searchQuery.length === 0) {
      return this.rttList;
    }
    return this.rttList.filter(item => {
      const showTextList = fcrRttManager.getShowText(item, item.currentShowDoubleLan, item.culture, item.currentTargetLan)
      showTextList[0] && showTextList[0].includes(searchQuery) || showTextList[1] && showTextList[1].includes(searchQuery)
    });
  }
  //获取匹配到的数量信息
  getSearctMatchCount(list: FcrRttItem[], searchQuery: string) {
    return list.map((item) => {
      //获取显示的文本信息
      const showTextList = fcrRttManager.getShowText(item, item.currentShowDoubleLan, item.culture, item.currentTargetLan)
      const regex = new RegExp(`(${searchQuery})`, 'gi');
      let match = showTextList[0] && showTextList[0].match(regex);
      let count = match ? match.length : 0;
      match = showTextList[1] && showTextList[1].match(regex);
      count += match ? match.length : 0;
      return count;
    })
  }

  //注册视图widget
  private registerWidget(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: !fcrRttManager.getConfigInfo().isOpenTranscribe() ? transI18n('fcr_conversion_button_open') : transI18n('fcr_conversion_button_close'),
      iconType: SvgIconEnum.FCR_V2_RTT,
    });
  }
  //取消注册视图widget
  private unRegisterWidget(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, {
      id: this.widgetName,
      name: !fcrRttManager.getConfigInfo().isOpenTranscribe() ? transI18n('fcr_conversion_button_open') : transI18n('fcr_conversion_button_close'),
      iconType: SvgIconEnum.FCR_V2_RTT,
    });
  }
  // 10分钟倒计时，单位为秒
  @observable
  countdown = ""
  // 10分钟倒计时，单位为秒
  @observable
  countdownDef = 600
  @observable
  isRunoutTime = true
  @observable
  rttList: FcrRttItem[] = [];
  @observable
  showTranslate = fcrRttManager.getConfigInfo().isOpenTranscribe();
  @observable
  goToScrollToBottom = 0;//通过随机数更新
  @observable
  openNotification:string|null = null;//通知显示处理


  private addRttListener() {
    //转写列表改变
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttShowConversion,
      onMessage: () => {
        runInAction(() => {
          this.showTranslate = true;
        })
      }
    })
    //转写列表改变
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttListChange,
      onMessage: () => {
        runInAction(() => {
          this.rttList = ([...fcrRttManager.getShowRttList()]);
          this.showTranslate = (fcrRttManager.getConfigInfo().isOpenTranscribe());
          this.goToScrollToBottom = Math.random();
        })
      }
    })
    //转写列表改变
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ReceiveTranscribeOpen,
      onMessage: (data: string) => {
        runInAction(() => {
          this.showTranslate = true
          this.openNotification = data
          this.setMinimize(false, { ...this.minimizedProperties });
        })
      }
    })
    //倒计时修改监听
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttReduceTimeChange,
      onMessage: (message: { reduce: number, sum: number, reduceTimeStr: string }) => {
        runInAction(() => {
          this.countdownDef = (message.sum)
          this.countdown = (message.reduceTimeStr)
          this.isRunoutTime = (message.reduce <= 0)
        })
      },
    })
    //默认启动下倒计时，用来初始化相关变量
    this.countdownDef = (fcrRttManager.getConfigInfo().experienceDefTime)
    this.countdown = (fcrRttManager.getConfigInfo().formatReduceTime())
    this.isRunoutTime = (fcrRttManager.getConfigInfo().experienceReduceTime <= 0)
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttConversionOpenSuccess,
      onMessage: () => {
        runInAction(() => {
          this.showTranslate = true
        })
      },
    })
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttConversionCloseSuccess,
      onMessage: () => {
        runInAction(() => {
          this.showTranslate = false
        })
      },
    })
  }

}
