import ReactDOM from 'react-dom';
import { App } from './app';
import type { AgoraWidgetController } from 'agora-edu-core';
import { FcrUISceneWidget, bound, transI18n } from 'agora-common-libs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { addResource } from './i18n/config';
import { Popover } from 'antd';
import { fcrRttManager } from '../../../common/rtt/rtt-manager'
import { IAgoraUserSessionInfo } from 'agora-edu-core/lib/stores/domain/common/user/struct';
import { observable, runInAction } from 'mobx';
import { ToastApi } from '@components/toast';
import { FcrRttItem } from 'src/common/rtt/rtt-item';
import { ReactNode } from 'react';
import { RttSettings } from './settings';

export class FcrRTTWidget extends FcrUISceneWidget {
  private static _installationDisposer?: CallableFunction;
  private _dom?: HTMLElement;
  private _privilege = false;
  get zContainer(): 0 | 10 {
    return 10;
  }
  get widgetName() {
    return 'rtt';
  }
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [1, 3].includes(role) || this._privilege;
  }
  get dragHandleClassName(): string {
    return 'fcr-rtt-widget-container';
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
      x: clientRect.width / 2 - this.defaultWidth / 2,
      y: clientRect.height - 125 - this.defaultHeight,
    };
  }
  defaultWidth = 750;
  defaultHeight = 50;

  get minWidth() {
    return 400;
  }

  async onInstall(controller: AgoraWidgetController) {
    await addResource();
    this.registerWidget(controller)
  }
  onPropertiesUpdate(properties: any, operator: IAgoraUserSessionInfo | null): void {
    // 获取下发数据
    console.log("更新数据了", properties + operator)
    fcrRttManager.onRoomWidgetPropertiesChange(properties, operator)
  }
  @bound
  onCreate(properties: any) {
    fcrRttManager.resetListener(this.widgetController)
    fcrRttManager.resetDefaultInfo(properties, this.classroomStore)
    console.log("数据初始化了", properties)
    this.setVisible(true);
    // this.widgetController.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, this.widgetName);
    this.registerWidget(this.widgetController)
    this.widgetController.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ToolboxChanged,
      onMessage: () => {
        this.setToolVisible(true)
        this.registerWidget(this.widgetController)
      }
    }
    );
    this.widgetController.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttboxChanged,
      onMessage: () => {
        // this.setRttVisible(true)
      }
    }
    );
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
  setToolVisible(visible: boolean) {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: visible,
    });
  }
  @bound
  setRttVisible(visible: boolean) {
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
  }
  @bound
  clsoe() {
    this.unRegisterWidget(this.widgetController)
    this.deleteWidget();
  }
  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onDestroy() {
    fcrRttManager.release()
    this.clearBrocastListener()
    this.unRegisterWidget(this.widgetController)
  }

  onUninstall(controller: AgoraWidgetController) {
    if (FcrRTTWidget._installationDisposer) {
      FcrRTTWidget._installationDisposer();
    }
  }

  clearBrocastListener() {
    //倒计时修改监听
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttReduceTimeChange, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttShowSubtitle, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttHideSubtitle, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttStateToOpening, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttStateToListener, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttSubtitleOpenSuccess, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttStateToNoSpeack, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttCloseSubtitle, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttContentChange, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttStateToNoSpeack, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttShowSetting, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttboxChanged, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.RttBoxshow, onMessage() { }, })
    this.widgetController.removeBroadcastListener({ messageType: AgoraExtensionRoomEvent.ToolboxChanged, onMessage() { }, })
  }

  //注册视图widget
  private registerWidget(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: !fcrRttManager.getConfigInfo().isOpenSubtitle() ? transI18n('fcr_subtitles_button_open') : transI18n('fcr_subtitles_button_close'),
      iconType: SvgIconEnum.FCR_V2_SUBTITIES,
    });
  }
  //取消注册视图widget
  private unRegisterWidget(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, {
      id: this.widgetName,
      name: !fcrRttManager.getConfigInfo().isOpenSubtitle() ? transI18n('fcr_subtitles_button_open') : transI18n('fcr_subtitles_button_close'),
      iconType: SvgIconEnum.FCR_V2_SUBTITIES,
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
  //是否显示字幕
  @observable
  visibleView = false
  @observable
  rttList: FcrRttItem[] = [];
  @observable
  starting = (false);
  @observable
  listening = false;
  @observable
  noOnespeakig = (false);
  @observable
  showTranslate = (false);
  @observable
  rttVisible = (true);
  @observable
  popoverVisible = (false);

  private addRttListener() {
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
    //字幕显示监听
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttShowSubtitle,
      onMessage: () => {
        runInAction(() => {
          this.visibleView = !this.visibleView
        })
      },
    })
    //字幕隐藏监听
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttHideSubtitle,
      onMessage: () => {
        runInAction(() => {
          this.visibleView = false
          this.starting = false
          this.listening = false
          this.noOnespeakig = true
        })
      },
    })
    //字幕开启中监听
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttStateToOpening,
      onMessage: () => {
        this.registerWidget(this.widgetController)
        runInAction(() => {
          this.starting = (true)
        })
      },
    })
    //字幕正在聆听监听
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttStateToListener,
      onMessage: () => {
        runInAction(() => {
          this.starting = false
          this.listening = true
          this.noOnespeakig = false
        })
      },
    })
    //字幕开启成功
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttSubtitleOpenSuccess,
      onMessage: () => {
        runInAction(() => {
          this.starting = false
          this.listening = false
          this.noOnespeakig = true
        })
      },
    })
    //字幕无人讲话监听
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttStateToNoSpeack,
      onMessage: () => {
        runInAction(() => {
          this.starting = false
          this.listening = false
          this.noOnespeakig = true
        })
      },
    })
    //字幕关闭
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttCloseSubtitle,
      onMessage: () => {
        this.registerWidget(this.widgetController)
        runInAction(() => {
          this.visibleView = false
          ToastApi.open({
            toastProps: {
              type: 'normal',
              content: transI18n('fcr_already_close_subtitles'),
            },
          })
        });
      },
    })
    //字幕内容改变
    this.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttContentChange,
      onMessage: () => {
        runInAction(() => {
          this.rttList = ([...fcrRttManager.getRttList()]);
          this.showTranslate = (fcrRttManager.getConfigInfo().isOpenTranscribe());
          this.rttVisible = (true)
          this.visibleView = (true)
          this.starting = (false)
          this.listening = (false)
          this.noOnespeakig = (false)
        });
        
       },
     })
     //设置弹窗显示处理
     this.addBroadcastListener({
       messageType: AgoraExtensionRoomEvent.RttShowSetting,
       onMessage:(message: { targetClsName: string, buttonView: ReactNode, showToConversionSetting: boolean, showToSubtitleSetting: boolean })=> {
         const element = document.getElementsByClassName(message.targetClsName)
         if (element) {
           ReactDOM.render(this.getRttSettingPopView(message.buttonView,message.showToConversionSetting,message.showToSubtitleSetting), element[0])
         }
       },
     })
     //实时转写按钮点击监听
     this.removeBroadcastListener({messageType: AgoraExtensionRoomEvent.RttBoxshow,onMessage: () => {}})
     this.addBroadcastListener({
       messageType: AgoraExtensionRoomEvent.RttBoxshow,
       onMessage: () => {
         const rttSettingBtn: HTMLElement | null = document.getElementById('fcr-rtt-settings-button')
         setTimeout(() => {
           if (rttSettingBtn) {
             const view = <div onClick={(e) => { e.stopPropagation(); }} className="fcr-rtt-box"><SvgImg type={SvgIconEnum.FCR_DROPUP4}></SvgImg></div>
             ReactDOM.render(this.getRttSettingPopView(view,false,true), rttSettingBtn)
           }
         }, 3000)
       },
     });
     //工具箱按钮点击监听
     this.addBroadcastListener({
       messageType: AgoraExtensionRoomEvent.ToolboxChanged,
       onMessage: () => {
         const portalTargetList = document.getElementsByClassName('fcr-toolbox-popover-item-dropbox')
         const portalTargetElement1 = portalTargetList[portalTargetList.length - 1];
         const portalTargetElement2 = portalTargetList[portalTargetList.length - 2];
         const view = <div onClick={(e) => { e.stopPropagation(); }} className="fcr-rtt-box"><SvgImg type={SvgIconEnum.FCR_DROPUP4}></SvgImg></div>
         if (portalTargetElement1) {
          ReactDOM.render(this.getRttSettingPopView(view,true,false), portalTargetElement1)
         }
         if (portalTargetElement2) {
          ReactDOM.render(this.getRttSettingPopView(view,true,false), portalTargetElement2)
         }
       },
     });
  }
  getRttSettingView(showToConversionSetting: boolean, showToSubtitleSetting: boolean,targetClassName:string) {
    return <RttSettings widget={this} showToConversionSetting={showToConversionSetting} showToSubtitleSetting={showToSubtitleSetting} targetClassName={targetClassName}></RttSettings>
  }
  getRttSettingPopView(buttonView: ReactNode, showToConversionSetting: boolean, showToSubtitleSetting: boolean) {
    const targetClassName = 'fcr-rtt-setting-' + Math.random()
    return <div style={{display: 'flex',alignItems: 'center',justifyContent: 'center',}}>
      <Popover
      onVisibleChange={(value) => {
        runInAction(() => { this.popoverVisible = value })
        //强行隐藏
        const target = document.getElementsByClassName(targetClassName)
        if (target.length > 0) {
          //@ts-ignore
          target[0].style.display = value ? 'block' : 'none'
        }
      }}
      content={<div className={targetClassName} >{this.getRttSettingView(showToConversionSetting, showToSubtitleSetting,targetClassName)}</div>}
      trigger="click">
      {buttonView}
    </Popover>
    </div>
  }
}