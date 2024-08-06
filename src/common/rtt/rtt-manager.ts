// import { getLanguage } from "agora-common-libs/*";
import { AgoraWidgetController, EduClassroomConfig, EduClassroomStore, EduRoleTypeEnum, EduUserStruct } from "agora-edu-core";
import { AgoraExtensionRoomEvent } from "../../../src/events";
import { FcrRttConfig, FcrRttLanguageData } from "./rtt-config";
import { FcrRttItem } from "./rtt-item";
import protoRoot from './proto';
import { v4 as uuidV4 } from 'uuid';
import { transI18n } from 'agora-common-libs';
import { IAgoraUserSessionInfo } from "agora-edu-core/lib/stores/domain/common/user/struct";
import { ToastApi } from "@components/toast";


class FcrRttManager {
    /**
     * 可选择源语言列表
     */
    sourceLanguageList = [
        new FcrRttLanguageData('fcr_subtitles_option_translation_display_chinese', "zh-CN"),
        new FcrRttLanguageData('fcr_subtitles_option_translation_display_english', "en-US",),
        new FcrRttLanguageData('fcr_subtitles_option_translation_display_japanese', "ja-JP",),
    ];
    /**
     * 可选择语言列表
     */
    targetLanguageList = [
        new FcrRttLanguageData("", ""),
        ...this.sourceLanguageList
    ];

    /**
     * 页面控制器
     */
    private widgetController: AgoraWidgetController | undefined;
    private classroomStore: EduClassroomStore | undefined;

    /**
     * 配置信息
     */
    private rttConfigInfo!: FcrRttConfig

    getConfigInfo() {
        if (fcrRttManager.rttConfigInfo == null) {
            this.resetData(null)
        }
        return fcrRttManager.rttConfigInfo
    }

    /**
     * 重置默认信息
     * @param properties 房间初始信息
     */
    resetDefaultInfo(properties: any, classroomStore: EduClassroomStore) {
        this.classroomStore = classroomStore;
        this.resetData(properties)
        // console.log(getLanguage())
        // this.currentSourceLan = {}
    }

    /**
     * 新增监听处理
     */
    resetListener(widgetController: AgoraWidgetController) {
        this.widgetController = widgetController;
        this.removeBroadCastListener()
        //新增修改声源语言监听
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttSourceLan,
            onMessage(message: string) {
                fcrRttManager.setCurrentSourceLan(message, true)
            },
        })
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttTargetLan,
            onMessage(message: string) {
                fcrRttManager.setCurrentTargetLan(message, true)
            },
        })
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttTextSize,
            onMessage(message: number) {
                fcrRttManager.setCurrentTextSize(message, true)
            },
        })
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttShowDoubleLan,
            onMessage(message: boolean) {
                fcrRttManager.setShowDoubleLan(message, true)
            },
        })
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.RttChangeToSubtitleState,
            onMessage() {
                if (fcrRttManager.getConfigInfo().isOpenSubtitle()) {
                    fcrRttManager.closeSubtitle()
                }else{
                    fcrRttManager.showSubtitle()
                }
            },
        })
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.RttChangeToConversionState,
            onMessage() {
                if (fcrRttManager.getConfigInfo().isOpenTranscribe()) {
                    fcrRttManager.closeConversion()
                }else{
                    fcrRttManager.showConversion()
                }
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
        this.removeMessageListener()
        this.removeBroadCastListener()
    }

    /**
     * 设置当前源语言
     * @param lan 语言
     * @param notify 是否发送广播通知
     */
    async setCurrentSourceLan(lan: string, notify: boolean) {
        const findData: FcrRttLanguageData | undefined = this.sourceLanguageList.find(item => item.value === lan);
        if (findData) {
            const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
            fcrRttManager.rttConfigInfo.setSourceLan(findData, notify, false)
            return this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
                fcrRttManager.rttConfigInfo.setSourceLan(findData, notify, true)
            })?.catch(() => {
                fcrRttManager.rttConfigInfo.setSourceLan(config.getSourceLan(), true, true)
            })
        }
    }

    /**
     * 设置当前翻译语言
     * @param lan 语言
     * @param notify 是否发送广播通知
     */
    async setCurrentTargetLan(lan: string, notify: boolean) {
        const findData = this.targetLanguageList.find(item => item.value === lan);
        if (findData) {
            const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
            fcrRttManager.rttConfigInfo.setTargetLan(findData, notify, false)
            return this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
                fcrRttManager.rttConfigInfo.setTargetLan(findData, notify, true)
            })?.catch(() => {
                fcrRttManager.rttConfigInfo.setTargetLan(config.getTargetLan(), true, true)
            })
        }
    }

    /**
     * 设置当前文本大小
     */
    setCurrentTextSize(size: number, notify: boolean) {
        fcrRttManager.rttConfigInfo.setTextSize(size, notify, true)
    }

    /**
     * 是否同时显示双语
     */
    setShowDoubleLan(showDouble: boolean, notify: boolean) {
        fcrRttManager.rttConfigInfo.setShowDoubleLan(showDouble, notify, true)
    }

    /**
     * 重置所有配置信息
     */
    resetAllConfig() {
        this.setShowDoubleLan(false, true)
        this.setCurrentTextSize(14, true)
        //@ts-ignore
        const config = new FcrRttConfig(window.EduClassroomConfig.sessionInfo.roomUuid, this.widgetController)
        config.setOpenSubtitle(fcrRttManager.rttConfigInfo.isOpenSubtitle(), false);
        config.setOpenTranscribe(fcrRttManager.rttConfigInfo.isOpenTranscribe(), false);
        this.sendRequest(config)?.then(() => {
        })
    }

    /**
     * 开启字幕定时列表
     */
    private openSubtitleTimerList: Array<NodeJS.Timeout> = []
    /**
     * 翻译转写列表数据
     */
    private rttList: FcrRttItem[] = []

    /**
     * 获取rtt数据列表
     */
    getRttList() {
        return this.rttList
    }

    /**
     * 消息数据处理,所有的this都要使用fcrRttManager，因为没有做变量化
     */
    private messageDataProcessing(uid: string, data: Uint8Array) {
        //清除字幕定时器
        if (fcrRttManager.openSubtitleTimerList && fcrRttManager.openSubtitleTimerList.length > 0) {
            for (const item of fcrRttManager.openSubtitleTimerList) {
                clearTimeout(item)
            }
        }
        //数据处理
        const pb = protoRoot.lookup('Text');
        if (pb) {
            //@ts-ignore
            const textstream = pb.decode(data);
            const lastItemByUid = fcrRttManager.rttList.findLast((item) => item.uid === textstream.uid);
            const lastItemIndexByUid = fcrRttManager.rttList.findLastIndex(
                (item) => item.uid === textstream.uid,
            );
            console.log("FcrRttReceiveMessage:", "接收到转写翻译信息->" + textstream)
            switch (textstream.dataType) {
                case 'transcribe':
                    let textStr = '';
                    let isFinal = false;
                    let confidence = 0.0;

                    //@ts-ignore
                    textstream.words.forEach((word) => {
                        textStr += word.text;
                        confidence = word.confidence;
                        isFinal = word.isFinal;
                    });
                    console.log('transcribe: ' + lastItemIndexByUid + textStr);

                    if (!lastItemByUid || lastItemByUid.isFinal) {
                        fcrRttManager.rttList = fcrRttManager.rttList.concat([
                            {
                                uuid: uuidV4(),
                                culture: textstream.culture,
                                text: textStr,
                                uid: textstream.uid,
                                time: textstream.time,
                                isFinal: isFinal,
                                confidence: confidence,
                            },
                        ])
                            .slice(-100);
                    } else {
                        fcrRttManager.rttList[lastItemIndexByUid] = {
                            ...lastItemByUid,
                            uuid: uuidV4(),
                            text: textStr,
                            time: textstream.time,
                            isFinal: isFinal,
                            confidence: confidence,
                        };
                    }
                    break;
                case 'translate':
                    console.log('Translation: ' + JSON.stringify(textstream));
                    const trans: { culture: string; text: string }[] = [];
                    //@ts-ignore
                    textstream.trans.forEach((transItem) => {
                        let transTextStr = '';
                        //@ts-ignore
                        transItem.texts.forEach((text) => {
                            console.log('Translation: ' + lastItemIndexByUid + text);
                            transTextStr += text;
                        });
                        trans.push({
                            culture: transItem.lang,
                            text: transTextStr,
                        });
                    });
                    if (lastItemByUid) {
                        fcrRttManager.rttList[lastItemIndexByUid] = {
                            ...lastItemByUid,
                            uuid: uuidV4(),
                            trans,
                        };
                    }
                    break;
            }
        }
        if (fcrRttManager.rttList.length > 0 && (fcrRttManager.rttConfigInfo.isOpenSubtitle() || fcrRttManager.rttConfigInfo.isOpenTranscribe())) {
            const last = fcrRttManager.rttList[fcrRttManager.rttList.length - 1]
            if (fcrRttManager.rttConfigInfo.isOpenSubtitle()) {
                fcrRttManager.widgetController?.broadcast(AgoraExtensionRoomEvent.RttContentChange, last)
            }
            if (fcrRttManager.rttConfigInfo.isOpenTranscribe()) {
                fcrRttManager.widgetController?.broadcast(AgoraExtensionRoomEvent.RttListChange)
            }
        }


        //消息传递后开启三秒无回调隐藏字幕
        const id = setTimeout(() => {
            fcrRttManager.widgetController?.broadcast(AgoraExtensionRoomEvent.RttHideSubtitle)
        }, 3000)
        fcrRttManager.openSubtitleTimerList.push(id)
    }

    //上一次配置信息
    private lastPropInfo = ""

    /**
     * 房间属性变更监听
     */
    onRoomWidgetPropertiesChange(properties: never | null, operator: IAgoraUserSessionInfo | null) {
        if (properties && Object.keys(properties).length > 0) {
            const config = properties["extra"]
            const localUser = this.classroomStore?.userStore.localUser
            const currentInfo = JSON.stringify(config);
            if (currentInfo === this.lastPropInfo || "" === currentInfo) {
                return
            }
            console.log("FcrRttRoomPropertiesChange:", "房间属性发生更新：" + currentInfo)
            this.lastPropInfo = currentInfo
            //判断是否改变了转写状态
            if (Number(config["transcribe"])) {
                const toOpen = 1 == Number(config["transcribe"])
                const textContent = `${this.formatRoleName(operator, localUser)}${transI18n(toOpen ? 'fcr_dialog_rtt_text_conversion_state_open' : 'fcr_dialog_rtt_text_conversion_state_close')}`
                const toastContent = `${this.formatRoleName(operator, localUser)}${transI18n(
                    localUser?.userUuid == operator?.userUuid ?
                        (toOpen ? 'fcr_dialog_rtt_toast_conversion_state_open_me_show' : 'fcr_dialog_rtt_toast_conversion_state_close_me_show') :
                        (toOpen ? 'fcr_dialog_rtt_toast_conversion_state_open' : 'fcr_dialog_rtt_toast_conversion_state_close')
                )}`
                this.rttList = this.rttList.concat([
                    {
                        uuid: uuidV4(),
                        culture: '',
                        text: textContent,
                        uid: '',
                        time: 0,
                        isFinal: true,
                        confidence: 0,
                    },
                ]).slice(-100);
                ToastApi.open({
                    toastProps: {
                        type: 'normal',
                        content: toastContent,
                    },
                });
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttListChange)
                // 监听是否开启实时转写
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.ReceiveTranscribeOpen, textContent)
            }
            //判断是否开启了翻译
            const targetLan = config["languages"]["target"] as any
            if (targetLan && targetLan.length > 0) {
                if (fcrRttManager.rttConfigInfo.getTargetLan().value !== targetLan[0] && "" !== targetLan[0]) {
                    this.rttList = this.rttList.concat([
                        {
                            uuid: uuidV4(),
                            culture: '',
                            text: transI18n('fcr_dialog_rtt_text_open_target_language'),
                            uid: '',
                            time: 0,
                            isFinal: true,
                            confidence: 0,
                        },
                    ])
                        .slice(-100);
                    this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttListChange)
                }
            }
            //判断是否修改了声源语言
            const sourceLan = config["languages"]["source"]
            const toOpen = 1 == Number(config["languages"]["source"])
            const textContent = `${this.formatRoleName(operator, localUser)}${transI18n(toOpen ? 'fcr_dialog_rtt_text_conversion_state_open' : 'fcr_dialog_rtt_text_conversion_state_close')}`
            if (sourceLan) {
                if (fcrRttManager.rttConfigInfo.getSourceLan().value !== sourceLan) {
                    const findData = this.sourceLanguageList.find(item => item.value === sourceLan);
                    if (findData) {
                        const useText = `${this.formatRoleName(operator, localUser)}${transI18n('fcr_dialog_rtt_text_change_source_language')}`
                        const languageText = transI18n(findData.text)
                        if (fcrRttManager.getConfigInfo().isOpenSubtitle() || fcrRttManager.getConfigInfo().isOpenTranscribe()) {
                            ToastApi.open({
                                toastProps: {
                                    type: 'normal',
                                    content: textContent,
                                },
                            });
                        }
                        this.rttList = this.rttList.concat([
                            {
                                uuid: uuidV4(),
                                culture: '',
                                text: useText + languageText,
                                uid: '',
                                time: 0,
                                isFinal: true,
                                confidence: 0,
                            },
                        ]).slice(-100);
                        this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttStateReceiveSourceLanChange)
                        this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttListChange)
                    }

                }
            }
            fcrRttManager.rttConfigInfo.initRoomeConfigInfo(properties, false)
        }
    }

    /**
     * 格式化名称角色显示
     * @param optionsUser 发起设置修改的用户信息
     * @param localUser 当前本地的用户信息
     */
    formatRoleName(optionsUser: any, localUser: EduUserStruct | undefined) {
        return `${EduRoleTypeEnum.student == Number(optionsUser.role) ? transI18n('fcr_rtt_role_student') :
            EduRoleTypeEnum.teacher == Number(optionsUser.role) ? transI18n('fcr_rtt_role_teacher') : ''
            }(${optionsUser.userUuid == localUser?.userUuid ? transI18n('fcr_rtt_role_me') : optionsUser.userName})  `
    }

    /**
     * 显示字幕
     */
    showSubtitle() {
        //消息实际处理
        this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttShowSubtitle)
        if (fcrRttManager.rttConfigInfo.isOpenSubtitle()) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttSubtitleOpenSuccess)
            //消息传递后开启三秒无回调隐藏字幕
            const id = setTimeout(() => {
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttHideSubtitle)
            }, 3000)
            this.openSubtitleTimerList.push(id)
        } else {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttStateToOpening)
            const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
            fcrRttManager.rttConfigInfo.setOpenSubtitle(true, false)
            this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
                fcrRttManager.rttConfigInfo.setOpenSubtitle(true, true)
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttSubtitleOpenSuccess)
                //开启消息监听
                this.addMessageListener()
                //字幕开启成功，发送文本修改
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttStateToListener)
                //两秒后显示当前没有人说话
                const id = setTimeout(() => {
                    this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttStateToNoSpeack)

                    //消息传递后开启三秒无回调隐藏字幕
                    const id = setTimeout(() => {
                        this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttHideSubtitle)
                    }, 3000)
                    this.openSubtitleTimerList.push(id)

                }, 2000)
                this.openSubtitleTimerList.push(id)
            })?.catch(() => {
                fcrRttManager.rttConfigInfo.setOpenSubtitle(config.isOpenSubtitle(), true)
            })
        }
    }
    /**
     * 关闭字幕
     */
    closeSubtitle() {
        const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
        fcrRttManager.rttConfigInfo.setOpenSubtitle(false, false)
        this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
            fcrRttManager.rttConfigInfo.setOpenSubtitle(false, true)
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttCloseSubtitle)
        })?.catch(() => {
            fcrRttManager.rttConfigInfo.setOpenSubtitle(config.isOpenSubtitle(), true)
        })
    }

    /**
     * 显示转写
     */
    showConversion() {
        //消息实际处理
        this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttShowConversion)
        if (fcrRttManager.rttConfigInfo.isOpenTranscribe()) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttConversionOpenSuccess)
        } else {
            const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
            fcrRttManager.rttConfigInfo.setOpenTranscribe(true, false)
            this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
                fcrRttManager.rttConfigInfo.setOpenTranscribe(true, true)
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttConversionOpenSuccess)
            })?.catch(() => {
                fcrRttManager.rttConfigInfo.setOpenTranscribe(config.isOpenTranscribe(), true)
            })
        }
    }
    /**
     * 关闭转写
     */
    closeConversion() {
        this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttCloseConversion)
        const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
        fcrRttManager.rttConfigInfo.setOpenTranscribe(false, false)
        this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
            fcrRttManager.rttConfigInfo.setOpenTranscribe(false, true)
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttConversionCloseSuccess)
        })?.catch(() => {
            fcrRttManager.rttConfigInfo.setOpenTranscribe(config.isOpenTranscribe(), true)
        })
    }

    //是否正在发起请求
    private loadingRequest = false
    /**
     * 发送请求
     */
    private sendRequest(tartgetConfig: FcrRttConfig | null): Promise<unknown> | undefined {
        if (this.loadingRequest) {
            return
        }
        this.loadingRequest = true
        const config = tartgetConfig ? tartgetConfig : fcrRttManager.rttConfigInfo
        const {
            rteEngineConfig: { ignoreUrlRegionPrefix, region },
            appId,
            sessionInfo: { roomUuid }
            //@ts-ignore
        } = window.EduClassroomConfig;
        const data = {
            languages: {
                source: config.getSourceLan().value,
                target: "" === config.getTargetLan().value ? [] : [config.getTargetLan().value],
            },
            transcribe: config.isOpenTranscribe() ? 1 : 0,
            subtitle: config.isOpenSubtitle() ? 1 : 0
        };
        const pathPrefix = `${ignoreUrlRegionPrefix ? '' : '/' + region.toLowerCase()
            }/edu/apps/${appId}`;
        return this.classroomStore?.api.fetch({
            path: `/v2/rooms/${roomUuid}/widgets/rtt/states/${(config.isOpenTranscribe() || config.isOpenSubtitle()) ? 1 : 0}`,
            method: 'PUT',
            data: {
                ...data
            },
            pathPrefix,
        }).then((data) => {
            if (data.data && Object.keys(data.data).length > 0) {
                const map = { extra: data.data }
                fcrRttManager.rttConfigInfo.initRoomeConfigInfo(map, false)
            }
        }).finally(() => { this.loadingRequest = false })
    }

    /**
     * 清除所有缓存信息
     */
    private clearStore() {
        localStorage.clear()
    }

    /**
     * 重置所有变量数据
     */
    private resetData(properties: never | null) {
        //@ts-ignore
        fcrRttManager.rttConfigInfo = new FcrRttConfig(window.EduClassroomConfig.sessionInfo.roomUuid, this.widgetController)
        fcrRttManager.rttConfigInfo.initRoomeConfigInfo(properties, true)
        //做监听判断
        this.addMessageListener()
    }

    /**
     * 新增消息监听
     */
    private addMessageListener() {
        this.removeMessageListener()
        this.classroomStore?.connectionStore.scene?.removeListener('stream-message-recieved', this.messageDataProcessing);
        this.classroomStore?.connectionStore.scene?.on('stream-message-recieved', this.messageDataProcessing);
        console.log("FcrRttAddMessageListener:", "新增消息接收监听")
    }
    /**
     * 移除消息监听
     */
    private removeMessageListener() {
        if (!(fcrRttManager.rttConfigInfo.isOpenSubtitle() || fcrRttManager.rttConfigInfo.isOpenTranscribe())) {
            this.classroomStore?.connectionStore.scene?.removeListener('stream-message-recieved', this.messageDataProcessing);
            console.log("FcrRttAddMessageListener:", "移除消息接收监听")
        }
    }
    /**
     * 清除所有广播监听器
     */
    private removeBroadCastListener(){
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttSourceLan,
            onMessage(message: string) {
                fcrRttManager.setCurrentSourceLan(message, true)
            },
        })
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttTargetLan,
            onMessage(message: string) {
                fcrRttManager.setCurrentTargetLan(message, true)
            },
        })
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttTextSize,
            onMessage(message: number) {
                fcrRttManager.setCurrentTextSize(message, true)
            },
        })
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttShowDoubleLan,
            onMessage(message: boolean) {
                fcrRttManager.setShowDoubleLan(message, true)
            },
        })
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.RttChangeToSubtitleState,
            onMessage() {
                if (fcrRttManager.getConfigInfo().isOpenSubtitle()) {
                    fcrRttManager.closeSubtitle()
                }else{
                    fcrRttManager.showSubtitle()
                }
            },
        })
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.RttChangeToConversionState,
            onMessage() {
                if (fcrRttManager.getConfigInfo().isOpenTranscribe()) {
                    fcrRttManager.closeConversion()
                }else{
                    fcrRttManager.showConversion()
                }
            },
        })
        this.widgetController = undefined;
    }

}
//@ts-ignore
window.fcrRttManager = new FcrRttManager()
//@ts-ignore
export const fcrRttManager: FcrRttManager = window.fcrRttManager;