import { fcrRttManager } from "./rtt-manager"
import { AgoraExtensionRoomEvent } from "../../../src/events";
import { AgoraWidgetController } from "agora-edu-core";

/**
 * 配置数据
 */
export class FcrRttConfig {
    /**
     * 房间id
     */
    private roomUuid!: string
    /**
     * 当前源语言
     */
    private currentSourceLan: FcrRttLanguageData = fcrRttManager.sourceLanguageList[0]
    /**
     * 当前翻译语言
     */
    private currentTargetLan: FcrRttLanguageData = fcrRttManager.targetLanguageList[0]
    /**
     * 是否显示双语
     */
    private showDoubleLan = false;
    /**
     * 文字大小
     */
    private textSize = 14
    /**
     * 页面控制器
     */
    private widgetController: AgoraWidgetController | undefined;
    /**
     * 是否开启转写
     */
     openTranscribe = false
    /**
     * 是否开启字幕
     */
     openSubtitle = false

    /**
     * 默认体验时间,单位-秒
     */
    readonly experienceDefTime = 60000
    /**
     * 剩余体验时间
     */
    experienceReduceTime = this.experienceDefTime

    constructor(roomUuid: string, controller: AgoraWidgetController|undefined) {
        this.roomUuid = roomUuid;
        this.widgetController = controller
        const show = localStorage.getItem(`${this.roomUuid}_showDoubleLan`)
        if (show) {
            this.showDoubleLan = Boolean(show)
        }
        const textSize = localStorage.getItem(`${this.roomUuid}_textSize`)
        if (textSize) {
            this.textSize = Number(textSize)
        }
    }

    copy(){
        const config = new FcrRttConfig(this.roomUuid,this.widgetController)
        config.currentSourceLan = this.currentSourceLan;
        config.currentTargetLan = this.currentTargetLan;
        config.showDoubleLan = this.showDoubleLan;
        config.textSize = this.textSize;
        config.openTranscribe = this.openTranscribe;
        config.openSubtitle = this.openSubtitle;
        config.experienceReduceTime = this.experienceReduceTime;
        return config
    }

    /**
     * 初始化房间配置信息
     * @param properties 房间配置信息
     */
    initRoomeConfigInfo(properties: never | null) {
        if(properties&& Object.keys(properties).length>0){
            const config = properties["extra"]
            this.openSubtitle = Number(config["subtitle"]) == 1 ? true : false
            this.openTranscribe = Number(config["transcribe"]) == 1 ? true : false
            const lanConfig = config["languages"]
            //源语言
            const sourceLan = lanConfig["source"]
            if (sourceLan) {
                const findData = fcrRttManager.sourceLanguageList.find(item => item.value === String(sourceLan));
                if (findData) {
                    this.currentSourceLan = findData
                }
            }
            //目标语言
            let targetLan= lanConfig["target"] as any
            if (targetLan && targetLan.length > 0) {
                targetLan = targetLan[0]
                const findData = fcrRttManager.targetLanguageList.find(item => item.value === String(targetLan));
                if (findData) {
                    this.currentTargetLan = findData
                }
            }
            //剩余体验时间
            this.experienceReduceTime = this.experienceDefTime - (properties["duration"] ? Number(properties["duration"]) : 0)
        }
    }


    setSourceLan(lan: FcrRttLanguageData, needNotify: boolean) {
        console.log("FcrRttConfigChange:", "修改目标源语言->" + lan.value)
        this.currentSourceLan = lan
        if (needNotify) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.ChangeRttSourceLan, this)
        }
    }
    getSourceLan() {
        return this.currentSourceLan
    }
    setTargetLan(lan: FcrRttLanguageData, needNotify: boolean) {
        console.log("FcrRttConfigChange:", "修改目标翻译语言->" + lan.value)
        this.currentTargetLan = lan
        if (needNotify) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.ChangeRttTargetLan, this)
        }
    }
    getTargetLan() {
        return this.currentTargetLan
    }
    setShowDoubleLan(show: boolean, needNotify: boolean,needSaveLocal:boolean) {
        console.log("FcrRttConfigChange:", "修改是否双语显示->" + show)
        this.showDoubleLan = show
        if(needSaveLocal){
            localStorage.setItem(`${this.roomUuid}_showDoubleLan`, show + "")
        }
        if (needNotify) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.ChangeRttShowDoubleLan, this)
        }
    }
    isShowDoubleLan() {
        return this.showDoubleLan;
    }
    setTextSize(size: number, needNotify: boolean, needSaveLocal: boolean) {
        console.log("FcrRttConfigChange:", "修改目标文本大小显示->" + size)
        this.textSize = size
        if(needSaveLocal){
            localStorage.setItem(`${this.roomUuid}_textSize`, size + "")
        }
        if (needNotify) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.ChangeRttTextSize, this)
        }
    }
    getTextSize() {
        return this.textSize
    }
}
/**
 * 语言数据
 */
export class FcrRttLanguageData {
    text: string;
    value: string;
    constructor(text: string, value: string) {
        this.text = text;
        this.value = value;
    }
}