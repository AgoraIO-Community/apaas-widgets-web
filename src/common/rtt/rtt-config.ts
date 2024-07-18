import { fcrRttManager } from "./rtt-manager"
/**
 * 配置数据
 */
export class FcrRttConfig{
    [x: string]: any;
    /**
     * 房间id
     */
    private roomUuid!:string
    /**
     * 当前源语言
     */
    private currentSourceLan:FcrRttLanguageData = fcrRttManager.sourceLanguageList[0]

    /**
     * 当前翻译语言
     */
    private currentTargetLan:FcrRttLanguageData = fcrRttManager.targetLanguageList[0]
    static setSourceLan: any;
    constructor(roomUuid:string){
        this.roomUuid = roomUuid;

    }
    setSourceLan(lan: FcrRttLanguageData) {
        this.currentSourceLan = lan
        localStorage.setItem(`${this.roomUuid}_sourceLan`, this.currentSourceLan.value)
    }
    getSourceLan(){
        return this.currentSourceLan
    }
}
/**
 * 语言数据
 */
export class FcrRttLanguageData{
    text:string;
    value:string;
    constructor(text:string,value:string){
        this.text = text;
        this.value = value;
    }
}