// import { getLanguage } from "agora-common-libs/*";
import { AgoraWidgetController, EduClassroomConfig } from "agora-edu-core";
import { AgoraExtensionRoomEvent } from "../../../src/events";
import { FcrRttConfig, FcrRttLanguageData } from "./rtt-config";

 class FcrRttManager {
    /**
     * 可选择源语言列表
     */
    sourceLanguageList = [
        new FcrRttLanguageData("zh-CN",""),
        new FcrRttLanguageData("en-US",""),
        new FcrRttLanguageData("ja-JP",""),
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

    /**
     * 配置信息
     */
    private rttConfigInfo!:FcrRttConfig

    /**
     * 重置默认信息
     * @param properties 房间初始信息
     */
    resetDefaultInfo(properties: any) {
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
    setCurrentSourceLan() { }

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
    private sendRequest(){

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