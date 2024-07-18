// import { getLanguage } from "agora-common-libs/*";
import { AgoraWidgetController, EduClassroomConfig, EduClassroomStore } from "agora-edu-core";
import { AgoraExtensionRoomEvent } from "../../../src/events";
import { FcrRttConfig, FcrRttLanguageData } from "./rtt-config";
import { transI18n } from 'agora-common-libs';


 class FcrRttManager {
    /**
     * 可选择源语言列表
     */
    sourceLanguageList = [
        new FcrRttLanguageData('fcr_subtitles_option_translation_display_chinese',"zh-CN"),
        new FcrRttLanguageData('fcr_subtitles_option_translation_display_english',"en-US",),
        new FcrRttLanguageData('fcr_subtitles_option_translation_display_japanese',"ja-JP",),
    ];
    /**
     * 可选择语言列表
     */
    targetLanguageList = [
        new FcrRttLanguageData("",""),
        ...this.sourceLanguageList
    ];

    /**
     * 页面控制器
     */
    private widgetController: AgoraWidgetController | undefined;
    private classroomStore: EduClassroomStore | undefined;
    private classroomConfig: EduClassroomConfig | undefined;

    /**
     * 配置信息
     */
    private rttConfigInfo!:FcrRttConfig

    getConfigInfo(){
        if(this.rttConfigInfo == null){
            this.resetData()
        }

        return this.rttConfigInfo
    }

    /**
     * 重置默认信息
     * @param properties 房间初始信息
     */
    resetDefaultInfo(properties: any, classroomStore: EduClassroomStore, classroomConfig: EduClassroomConfig) {
        this.classroomStore = classroomStore;
        this.classroomConfig = classroomConfig;
        this.resetData()
        // console.log(getLanguage())
        console.log(localStorage.getItem("language"))
        // this.currentSourceLan = {}
    }

    

    /**
     * 新增监听处理
     */
    resetListener(widgetController: AgoraWidgetController) {
        this.widgetController = widgetController;
        //新增修改声源语言监听
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.changeRttSourceLan,
            onMessage(message) {
                console.log("修改目标语言" + message)
            },
        })
    }
    /**
     * 释放
     */
    release() {
        //清除缓存
        this.clearStore()
        //清除广播接收器
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.changeRttSourceLan,
            onMessage(message) {
                console.log("修改目标语言" + message)
            },
        })
        this.widgetController = undefined;
    }


    /**
     * 设置当前源语言
     */
    setCurrentSourceLan(lan: any) {
        this.rttConfigInfo.setSourceLan(lan)
        console.log( "getSourceLan",this.rttConfigInfo.getSourceLan())
     }

    /**
     * 设置当前翻译语言
     */
    setCurrentTargetLan() {
    }

    /**
     * 设置当前文本大小
     */
    setCurrentTextSize() {
    }

    /**
     * 是否同时显示双语
     */
    setShowDoubleLan() {

    }

    /**
     * 显示设置弹窗
     * @param tartDomId 要展示的目标父级容器的domId
     */
    showSetting(tartDomId: string) {
        
    }

    /**
     * 发送请求
     */
    private sendRequest(state:number,sceneId:string){
        const {
            rteEngineConfig: { ignoreUrlRegionPrefix, region},
            appId,
            //@ts-ignore
          } = window.EduClassroomConfig;
          const data = {
            languages: {
                
                      source:this.rttConfigInfo.getSourceLan(),
                      target: [localStorage.getItem("translatelanguageId") || 'en-US'],
                    },
                    transcribe: 0,
                    subtitle:1
          };
          const pathPrefix = `${
            ignoreUrlRegionPrefix ? '' : '/' + region.toLowerCase()
          }/edu/apps/${appId}`;
          this.classroomStore?.api.fetch({
            path: `/v2/rooms/${sceneId}/widgets/rtt/states/${state}`,
            method: 'PUT',
            data: {
              ...data
            },
            pathPrefix,
          });
    }

    /**
     * 保存缓存信息
     */
    private saveStore(){
        this.rttConfigInfo.setSourceLan(new FcrRttLanguageData("", ""))
    }
    /**
     * 清除所有缓存信息
     */
    private clearStore(){
        localStorage.clear()
    }

    /**
     * 重置所有变量数据
     */
    private resetData(){
        this.rttConfigInfo = new FcrRttConfig(EduClassroomConfig.shared.sessionInfo.roomName)
    }

}
export const fcrRttManager = new FcrRttManager();