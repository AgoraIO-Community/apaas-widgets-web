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
    private classroomConfig: EduClassroomConfig | undefined;

    /**
     * 配置信息
     */
    private rttConfigInfo!: FcrRttConfig

    getConfigInfo() {
        if (this.rttConfigInfo == null) {
            this.resetData(null)
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
        this.resetData(properties)
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
            messageType: AgoraExtensionRoomEvent.ChangeRttSourceLan,
            onMessage(message) {
                // setCurrentSourceLan(message)
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
            messageType: AgoraExtensionRoomEvent.ChangeRttSourceLan,
            onMessage(message) {
                console.log("修改目标语言" + message)
            },
        })
        this.widgetController = undefined;
    }

    /**
     * 设置当前源语言
     * @param lan 语言
     * @param notify 是否发送广播通知
     */
    setCurrentSourceLan(lan: string, notify: boolean) {
        const findData:FcrRttLanguageData|undefined = this.sourceLanguageList.find(item => item.value === lan);
        if (findData) {
            const config: FcrRttConfig = this.rttConfigInfo.copy()
            config.setSourceLan(findData, false)
            this.sendRequest(config)?.then(() => {
                this.rttConfigInfo.setSourceLan(findData, notify)
            })
        }
    }

    /**
     * 设置当前翻译语言
     * @param lan 语言
     * @param notify 是否发送广播通知
     */
    setCurrentTargetLan(lan: string, notify: boolean) {
        const findData = this.targetLanguageList.find(item => item.value === lan);
        if (findData) {
            const config: FcrRttConfig = this.rttConfigInfo.copy()
            config.setTargetLan(findData, false)
            this.sendRequest(config)?.then(() => {
                this.rttConfigInfo.setTargetLan(findData, notify)
            })
        }
    }

    /**
     * 设置当前文本大小
     */
    setCurrentTextSize(size: number, notify: boolean) {
        this.rttConfigInfo.setTextSize(size, notify, true)
        
    }

    /**
     * 是否同时显示双语
     */
    setShowDoubleLan(showDouble: boolean, notify: boolean) {
        const config: FcrRttConfig = this.rttConfigInfo.copy()
        config.setShowDoubleLan(showDouble, false, false)
        this.sendRequest(config)?.then(() => {
            this.rttConfigInfo.setShowDoubleLan(showDouble, notify, true)
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
        if (fcrRttManager.rttList.length > 0) {
            const last = fcrRttManager.rttList[fcrRttManager.rttList.length - 1]
            fcrRttManager.widgetController?.broadcast(AgoraExtensionRoomEvent.RttContentChange, last)
            fcrRttManager.widgetController?.broadcast(AgoraExtensionRoomEvent.RttListChange)
        }


        //消息传递后开启三秒无回调隐藏字幕
        const id = setTimeout(() => {
            fcrRttManager.widgetController?.broadcast(AgoraExtensionRoomEvent.RttHideSubtitle)
        }, 3000)
        fcrRttManager.openSubtitleTimerList.push(id)
    }

    /**
     * 房间属性变更监听
     */
    onRoomWidgetPropertiesChange(properties: never | null, operator: IAgoraUserSessionInfo | null) {
        debugger
        if (properties && Object.keys(properties).length > 0) {
            const config = properties["extra"]
            const localUser = this.classroomStore?.userStore.localUser
            //判断是否改变了转写状态
            if (this.rttConfigInfo.openTranscribe !== (Number(config["transcribe"]) == 1 ? true : false)) {
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
                ])
                    .slice(-100);
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttListChange)
            }
            //判断是否开启了翻译
            const targetLan = config["languages"]["target"] as any
            if (targetLan && targetLan.length > 0) {
                if (this.rttConfigInfo.getTargetLan().value !== targetLan[0] && "" !== targetLan[0]) {
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
            if (sourceLan) {
                if (this.rttConfigInfo.getSourceLan().value !== sourceLan) {
                    const findData = this.sourceLanguageList.find(item => item.value === sourceLan);
                    if (findData) {
                        const useText = `${this.formatRoleName(operator, localUser)}${transI18n('fcr_dialog_rtt_text_change_source_language')}`
                        const languageText = transI18n(findData.text)
                        ToastApi.open({
                            toastProps: {
                                type: 'normal',
                                content: "老师(我) 开启了实时转写服务，全体用户可见。",
                            },
                        });
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
                        ])
                            .slice(-100);
                        this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttStateReceiveSourceLanChange)
                        this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttListChange)
                    }

                }
            }
            this.rttConfigInfo.initRoomeConfigInfo(properties)
        }
    }

    /**
     * 格式化名称角色显示
     * @param optionsUser 发起设置修改的用户信息
     * @param localUser 当前本地的用户信息
     */
    formatRoleName(optionsUser: any, localUser: EduUserStruct | undefined) {
        let roleName = ""
        if (EduRoleTypeEnum.student == Number(optionsUser.role)) {
            roleName += transI18n('role.student')
        } else if (EduRoleTypeEnum.teacher == Number(optionsUser.role)) {
            roleName += transI18n('role.teacher')
        } else {
            ""
        }
        roleName += "("
        if (optionsUser.userUuid == localUser?.userUuid) {
            roleName += transI18n('i')
        } else {
            roleName += optionsUser.userName
        }
        roleName += ")"
        return roleName;
    }


    /**
     * 显示字幕
     */
    showSubtitle() {
        //消息实际处理
        this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttShowSubtitle)
        if (this.rttConfigInfo.openSubtitle || this.rttConfigInfo.openTranscribe) {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttRttOpenSuccess)
            //消息传递后开启三秒无回调隐藏字幕
            const id = setTimeout(() => {
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttHideSubtitle)
            }, 3000)
            this.openSubtitleTimerList.push(id)
        } else {
            const config: FcrRttConfig = this.rttConfigInfo.copy()
            config.openSubtitle = true
            this.sendRequest(config)?.then(() => {
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
            })
        }
    }
    /**
     * 关闭字幕
     */
    closeSubtitle() {
        const config: FcrRttConfig = this.rttConfigInfo.copy()
        config.openSubtitle = false
        this.sendRequest(config)?.then(() => {
            this.widgetController?.broadcast(AgoraExtensionRoomEvent.RttCloseSubtitle)
        })
    }

    /**
     * 发送请求
     */
    private sendRequest(tartgetConfig: FcrRttConfig | null): Promise<unknown> | undefined {
        const config = tartgetConfig ? tartgetConfig : this.rttConfigInfo
        const {
            rteEngineConfig: { ignoreUrlRegionPrefix, region },
            appId,
            //@ts-ignore
        } = window.EduClassroomConfig;
        const data = {
            languages: {
                source: config.getSourceLan().value,
                target: [config.getTargetLan().value],
            },
            transcribe: config.openTranscribe,
            subtitle: config.openSubtitle
        };
        const pathPrefix = `${ignoreUrlRegionPrefix ? '' : '/' + region.toLowerCase()
            }/edu/apps/${appId}`;
        return this.classroomStore?.api.fetch({
            path: `/v2/rooms/${EduClassroomConfig.shared.sessionInfo.roomUuid}/widgets/rtt/states/${(config.openTranscribe || config.openSubtitle) ? 1 : 0}`,
            method: 'PUT',
            data: {
                ...data
            },
            pathPrefix,
        });
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
        this.rttConfigInfo = new FcrRttConfig(EduClassroomConfig.shared.sessionInfo.roomUuid, this.widgetController)
        this.rttConfigInfo.initRoomeConfigInfo(properties)
        //做监听判断
        this.addMessageListener()
    }

    /**
     * 新增消息监听
     */
    private addMessageListener() {
        if (this.rttConfigInfo.openSubtitle || this.rttConfigInfo.openTranscribe) {
            this.classroomStore?.connectionStore.scene?.removeListener('stream-message-recieved', this.messageDataProcessing);
            this.classroomStore?.connectionStore.scene?.on('stream-message-recieved', this.messageDataProcessing);
        }
    }
    /**
     * 移除消息监听
     */
    private removeMessageListener() {
        if (!(this.rttConfigInfo.openSubtitle || this.rttConfigInfo.openTranscribe)) {
            this.classroomStore?.connectionStore.scene?.removeListener('stream-message-recieved', this.messageDataProcessing);
        }
    }

}
export const fcrRttManager = new FcrRttManager();