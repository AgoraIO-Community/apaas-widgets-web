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
    private openTranscribe = false
    /**
     * 是否开启字幕
     */
    private openSubtitle = false
    /**
     * 默认体验时间,单位-秒
     */
    readonly experienceDefTime = 600
    /**
     * 剩余体验时间
     */
    experienceReduceTime = this.experienceDefTime

    constructor(roomUuid: string, controller: AgoraWidgetController | undefined) {
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

    copy() {
        const config = new FcrRttConfig(this.roomUuid, this.widgetController)
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
    initRoomeConfigInfo(properties: any | null, notify: boolean) {
        if (properties && Object.keys(properties).length > 0) {
            const config = properties["extra"]
            this.setOpenSubtitle(Number(config["subtitle"]) == 1 ? true : false, true)
            this.setOpenTranscribe(Number(config["transcribe"]) == 1 ? true : false, true)
            if (this.openSubtitle && notify) {
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttSubtitleOpenSuccess)
            }
            if (this.openTranscribe && notify) {
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttShowConversion)
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttConversionOpenSuccess)
            }
            const lanConfig = config["languages"]
            if (lanConfig) {
                //源语言
                const sourceLan = Object.keys(lanConfig).indexOf("source") >= 0 ? lanConfig["source"] : null
                if (sourceLan) {
                    const findData = fcrRttManager.sourceLanguageList.find(item => item.value === String(sourceLan));
                    if (findData) {
                        this.currentSourceLan = findData
                    }
                }
                //目标语言
                let targetLan = Object.keys(lanConfig).indexOf("target") >= 0 ? lanConfig["target"] as any : null
                if (targetLan && targetLan.length > 0) {
                    targetLan = targetLan[0]
                    const findData = fcrRttManager.targetLanguageList.find(item => item.value === String(targetLan));
                    if (findData) {
                        this.currentTargetLan = findData
                    }
                }
            }
            //剩余体验时间
            this.experienceReduceTime = Math.max(this.experienceDefTime - (config["duration"] ? Number(config["duration"]) : 0), 0)
            this.startReduceTimer()
        }
    }

    setOpenTranscribe(state: boolean, needSaveLocal: boolean) {
        this.openTranscribe = state
        if (needSaveLocal) {
            console.log("FcrRttConfigChange:", "修改是否开启转写->" + state)
            localStorage.setItem(`${this.roomUuid}_transcribe`, state + "")
        }
    }
    setOpenSubtitle(state: boolean, needSaveLocal: boolean) {
        this.openSubtitle = state
        if (needSaveLocal) {
            console.log("FcrRttConfigChange:", "修改是否开启字幕->" + state)
            localStorage.setItem(`${this.roomUuid}_subtitle`, state + "")
        }
    }
    isOpenTranscribe() {
        return this.openTranscribe
    }
    isOpenSubtitle() {
        return this.openSubtitle
    }

    setSourceLan(lan: FcrRttLanguageData, needNotify: boolean, needSaveLocal: boolean) {
        console.log("FcrRttConfigChange:", "修改目标源语言->" + lan.value)
        this.currentSourceLan = lan
        if (needSaveLocal) {
            localStorage.setItem(`${this.roomUuid}_sourceLan`, lan.value)
        }
        if (needNotify) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttSourceLanChangeFinish, { config: this, value: lan })
        }
    }
    getSourceLan() {
        return this.currentSourceLan
    }
    setTargetLan(lan: FcrRttLanguageData, needNotify: boolean, needSaveLocal: boolean) {
        console.log("FcrRttConfigChange:", "修改目标翻译语言->" + lan.value)
        this.currentTargetLan = lan
        if (needSaveLocal) {
            localStorage.setItem(`${this.roomUuid}_targetLan`, lan.value)
        }
        if (needNotify) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttTargetLanChangeFinish, { config: this, value: lan })
        }
    }
    getTargetLan() {
        return this.currentTargetLan
    }
    setShowDoubleLan(show: boolean, needNotify: boolean, needSaveLocal: boolean) {
        console.log("FcrRttConfigChange:", "修改是否双语显示->" + show)
        this.showDoubleLan = show
        if (needSaveLocal) {
            localStorage.setItem(`${this.roomUuid}_showDoubleLan`, show + "")
        }
        if (needNotify) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttShowDoubleLanChangeFinish,  { config: this, value: show })
        }
    }
    isShowDoubleLan() {
        return this.showDoubleLan;
    }
    setTextSize(size: number, needNotify: boolean, needSaveLocal: boolean) {
        console.log("FcrRttConfigChange:", "修改目标文本大小显示->" + size)
        this.textSize = size
        if (needSaveLocal) {
            localStorage.setItem(`${this.roomUuid}_textSize`, size + "")
        }
        if (needNotify) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttTextSizeChagneFinish, { config: this, value: size })
        }
    }
    getTextSize() {
        return this.textSize
    }

    //倒计时逻辑处理
    private reduceTimerId: NodeJS.Timeout | undefined;
    private startReduceTimer() {
        if (this.reduceTimerId != null) {
            clearInterval(this.reduceTimerId)
        }
        if (this.isOpenSubtitle() || this.isOpenTranscribe()) {
            if (this.experienceReduceTime <= 0) {
                this.experienceReduceTime = Math.max(this.experienceReduceTime, 0)
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttReduceTimeChange, { reduce: this.experienceReduceTime, sum: this.experienceDefTime, reduceTimeStr: this.formatReduceTime() })
                return
            }
            this.reduceTimerId = setInterval(() => {
                this.experienceReduceTime -= 1
                this.experienceReduceTime = Math.max(this.experienceReduceTime, 0)
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttReduceTimeChange, { reduce: this.experienceReduceTime, sum: this.experienceDefTime, reduceTimeStr: this.formatReduceTime() })
                if (this.experienceReduceTime <= 0) {
                    clearInterval(this.reduceTimerId)
                }
            }, 1000)
        }
    }
    //格式化时间
    formatReduceTime(): string {
        const minutes = Math.floor(this.experienceReduceTime / 60);
        const secs = Math.floor(this.experienceReduceTime % 60);
        return `${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
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