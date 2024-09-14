// import { getLanguage } from "agora-common-libs/*";
import { AgoraWidgetController, EduClassroomStore, EduRoleTypeEnum, EduUserStruct } from "agora-edu-core";
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from "../../events";
import { FcrRttConfig, FcrRttLanguageData } from "./rtt-config";
import { FcrRttItem } from "./rtt-item";
import protoRoot from './proto';
import { v4 as uuidV4 } from 'uuid';
import { transI18n } from 'agora-common-libs';
import { IAgoraUserSessionInfo } from "agora-edu-core/lib/stores/domain/common/user/struct";
import { ToastApi } from "@components/toast";
import { notification } from "antd";
import './NotificationStyle.css';
import { SvgIconEnum, SvgImg } from "@components/svg-img";


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
        if (fcrRttManager.rttConfigInfo === null) {
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
        this.removeBroadCaseListener()
        //新增修改声源语言监听
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttSourceLan,
            onMessage(message:string) {
                fcrRttManager.setCurrentSourceLan(message,true)
            },
        })
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttTargetLan,
            onMessage(message:string) {
                fcrRttManager.setCurrentTargetLan(message,true)
            },
        })
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttTextSize,
            onMessage(message:number) {
                fcrRttManager.setCurrentTextSize(message,true)
            },
        })
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttShowDoubleLan,
            onMessage(message:boolean) {
                fcrRttManager.setShowDoubleLan(message,true)
            },
        })
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.RttChangeToSubtitleOpenState,
            onMessage() {
                if (fcrRttManager.getConfigInfo().isOpenSubtitle()) {
                    fcrRttManager.closeSubtitle()
                }else{
                    fcrRttManager.showSubtitle()
                }
            },
        })
        widgetController.addBroadcastListener({
            messageType: AgoraExtensionRoomEvent.RttChangeToConversionOpenState,
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
        this.removeBroadCaseListener()
        this.widgetController = undefined;
    }

    /**
     * 设置当前源语言
     * @param lan 语言
     * @param notify 是否发送广播通知
     */
    setCurrentSourceLan(lan: string, notify: boolean) {
        if(this.loadingRequest){return}
        const findData: FcrRttLanguageData | undefined = this.sourceLanguageList.find(item => item.value === lan);
        if (findData) {
            const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
            fcrRttManager.rttConfigInfo.setSourceLan(findData, false,false)
            this.localIsChangeSourceLan = true;
            this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
                fcrRttManager.rttConfigInfo.setSourceLan(findData, notify,true)
            })?.catch(()=>{
                fcrRttManager.rttConfigInfo.setSourceLan(config.getSourceLan(), false,false)
            })
        }
    }

    /**
     * 设置当前翻译语言
     * @param lan 语言
     * @param notify 是否发送广播通知
     */
    setCurrentTargetLan(lan: string, notify: boolean) {
        if(this.loadingRequest){return}
        const findData = this.targetLanguageList.find(item => item.value === lan);
        if (findData) {
            const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
            fcrRttManager.rttConfigInfo.setTargetLan(findData, false,false)
            this.localIsChangeTarget = findData.value !== config.getSourceLan().value && "" !== findData.value
            this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
                fcrRttManager.rttConfigInfo.setTargetLan(findData, notify,true)
            })?.catch(()=>{
                fcrRttManager.rttConfigInfo.setTargetLan(config.getTargetLan(), false,false)
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

    //重置所有配置信息
    resetAllConfig() {
        fcrRttManager.rttConfigInfo.setTextSize(14, true, true)
    }

    /**
     * 开启字幕定时列表
     */
    private openSubtitleTimerList: Array<NodeJS.Timeout> = []
    /**
     * 翻译转写列表数据
     */
    private allRecordList: FcrRttItem[] = []
    private showRecordList: FcrRttItem[] = []
    private lastRecord: FcrRttItem|null = null

    /**
     * 获取rtt数据列表
     */
    getShowRttList() {
        return fcrRttManager.showRecordList
    }
    /**
     * 获取rtt数据列表
     */
    getLastRecord() {
        return fcrRttManager.lastRecord
    }

    /**
     * 消息数据处理,所有的this都要使用fcrRttManager，因为没有做变量化
     */
    private messageDataProcessing(uid: string, data: Uint8Array) {
        //当前仅教师显示，因为web端学生角色没有入口，分组内也不必要记录处理数据
        if(EduRoleTypeEnum.teacher !== fcrRttManager.classroomStore?.userStore.localUser?.userRole || fcrRttManager.isInSubRoom()){
            return
        }
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
            const lastItemByUid = fcrRttManager.allRecordList.findLast((item) => item.uid === textstream.uid);
            const lastItemIndexByUid = fcrRttManager.allRecordList.findLastIndex(
                (item) => item.uid === textstream.uid,
            );
            console.log("FcrRttReceiveMessage:", "接收到转写翻译信息->" , textstream)
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

                    if (!lastItemByUid || lastItemByUid.isFinal) {
                        fcrRttManager.allRecordList = fcrRttManager.allRecordList.concat([
                            {
                                uuid: uuidV4(),
                                culture: textstream.culture,
                                text: textStr,
                                uid: textstream.uid,
                                time: textstream.time,
                                isFinal: isFinal,
                                confidence: confidence,
                                currentTargetLan:fcrRttManager.getConfigInfo().getTargetLan().value,
                                currentShowDoubleLan:fcrRttManager.getConfigInfo().isShowDoubleLan()
                            },
                        ])
                            .slice(-100);
                    } else {
                        fcrRttManager.allRecordList[lastItemIndexByUid] = {
                            ...lastItemByUid,
                            text: textStr,
                            time: textstream.time,
                            isFinal: isFinal,
                            confidence: confidence,
                        };
                    }
                    break;
                case 'translate':
                    console.log('Translation: ' + JSON.stringify(textstream));
                    const trans: { culture: string; text: string }[] = lastItemByUid ? lastItemByUid.trans ? lastItemByUid.trans : [] : [];
                    //@ts-ignore
                    textstream.trans.forEach((transItem) => {
                        let transTextStr = '';
                        //@ts-ignore
                        transItem.texts.forEach((text) => {
                            console.log('Translation: ' + lastItemIndexByUid + text);
                            transTextStr += text;
                        });
                        const find = trans.find(item=>item.culture === transItem.culture)
                        if(find){
                            find.text = transTextStr
                        }else{
                            trans.push({
                                culture: transItem.lang,
                                text: transTextStr,
                            });
                        }
                    });
                    if (lastItemByUid) {
                        fcrRttManager.allRecordList[lastItemIndexByUid] = {
                            ...lastItemByUid,
                            trans,
                        };
                    }
                    break;
            }
        }
        fcrRttManager.lastRecord = fcrRttManager.allRecordList[fcrRttManager.allRecordList.length - 1]
        if (fcrRttManager.getConfigInfo().isOpenTranscribe()) {
            const showItem = fcrRttManager.showRecordList.length >= 0 ? fcrRttManager.showRecordList[fcrRttManager.showRecordList.length - 1] : null
            if (showItem?.uuid != null && showItem.uuid === fcrRttManager.lastRecord.uuid) {
                fcrRttManager.showRecordList[fcrRttManager.showRecordList.length - 1] = fcrRttManager.lastRecord
            } else {
                fcrRttManager.showRecordList.push(fcrRttManager.lastRecord)
            }
        }
        if (fcrRttManager.allRecordList.length > 0) {
            const last = fcrRttManager.allRecordList[fcrRttManager.allRecordList.length - 1]
            console.log('最后一条翻译转写信息:', last);
            if (fcrRttManager.rttConfigInfo.isOpenSubtitle()) {
                fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttContentChange, last)
            }
            if (fcrRttManager.rttConfigInfo.isOpenTranscribe()) {
                fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttListChange)
            }
        }


        //消息传递后开启三秒无回调隐藏字幕
        const id = setTimeout(() => {
            fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttHideSubtitle)
        }, 3000)
        fcrRttManager.openSubtitleTimerList.push(id)
    }

    //上一次配置信息
    private lastPropInfo = ""
    //本地是否修改了声源语言,因为未返回实际的修改字段，所以需要做首次获取的更新处理，因为首次开启关闭会触发这个更新，但是实际上声源不一定会有修改
    private localIsChangeSourceLan = false;
    //本地是否修改了转写状态，原因同上
    private localIsChangeTranscribeState = false;
    //本地是否修改了翻译状态，原因同上
    private localIsChangeTarget = false;

    /**
     * 房间属性变更监听
     */
    onRoomWidgetPropertiesChange(properties: never | null, operator: IAgoraUserSessionInfo | null) {
        //这条是系统的，跳过
        if(operator && "server" === operator.userName){
            return
        }
        if (properties && Object.keys(properties).length > 0 ) {
            const config = properties["extra"]
            console.log("FcrRttRoomPropertiesChange:", "房间属性发生更新：" , config)
            const localUser = fcrRttManager.classroomStore?.userStore.localUser
            const currentInfo = JSON.stringify(config);
            if(currentInfo === fcrRttManager.lastPropInfo || "" === currentInfo){
                return
            }
            fcrRttManager.lastPropInfo = currentInfo
            //判断是否改变了转写状态
            const transcribeState = Number(config["transcribe"])
            if (transcribeState != null && operator) {
                const toOpen = 1 === transcribeState
                if (fcrRttManager.rttConfigInfo.isOpenTranscribe() !== toOpen || (operator.userUuid === localUser?.userUuid && fcrRttManager.localIsChangeTranscribeState)) {
                    fcrRttManager.localIsChangeTranscribeState = false;
                    const textContent = `${fcrRttManager.formatRoleName(operator, localUser)}${transI18n(toOpen ? 'fcr_dialog_rtt_text_conversion_state_open' : 'fcr_dialog_rtt_text_conversion_state_close')}`
                    const toastContent = `${fcrRttManager.formatRoleName(operator, localUser)}${transI18n(
                        localUser?.userUuid === operator?.userUuid ?
                            (toOpen ? 'fcr_dialog_rtt_toast_conversion_state_open_me_show' : 'fcr_dialog_rtt_toast_conversion_state_close_me_show') :
                            (toOpen ? 'fcr_dialog_rtt_toast_conversion_state_open' : 'fcr_dialog_rtt_toast_conversion_state_close')
                    )}`
                    fcrRttManager.allRecordList = fcrRttManager.allRecordList.concat([
                        {
                            uuid: uuidV4(),
                            culture: '',
                            text: textContent,
                            uid: '',
                            time: 0,
                            isFinal: true,
                            confidence: 0,
                            currentTargetLan: fcrRttManager.getConfigInfo().getTargetLan().value,
                            currentShowDoubleLan:fcrRttManager.getConfigInfo().isShowDoubleLan()
                        },
                    ]).slice(-100);
                    fcrRttManager.showRecordList.push(fcrRttManager.allRecordList[fcrRttManager.allRecordList.length - 1])
                    ToastApi.open({
                        toastProps: {
                            type: 'normal',
                            content: toastContent,
                        },
                    });
                    if(!fcrRttManager.rttConfigInfo.isOpenTranscribe() && toOpen){
                        this.showNotificationOtherOpenConversion(textContent)
                    }
                    fcrRttManager.rttConfigInfo.setOpenTranscribe(toOpen,true)
                    fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttListChange)
                    if(toOpen){
                        fcrRttManager.showConversion()
                    }else{
                        fcrRttManager.closeConversion()
                    }
                    // fcrRttManager.sendBroadcat(toOpen ? AgoraExtensionRoomEvent.RttConversionOpenSuccess : AgoraExtensionRoomEvent.RttConversionCloseSuccess)
                }
            }
            //判断是否开启了翻译
            const targetLan = config["languages"]["target"] as any
            if (targetLan && targetLan.length > 0 && operator && operator.userUuid === localUser?.userUuid && fcrRttManager.localIsChangeTarget) {
                fcrRttManager.rttConfigInfo.setTargetLanList(targetLan)
                if (fcrRttManager.rttConfigInfo.getTargetLan().value !== targetLan[0] && "" !== targetLan[0]) {
                    fcrRttManager.localIsChangeTarget = false;
                    fcrRttManager.allRecordList = fcrRttManager.allRecordList.concat([
                        {
                            uuid: uuidV4(),
                            culture: '',
                            text: transI18n('fcr_dialog_rtt_text_open_target_language'),
                            uid: '',
                            time: 0,
                            isFinal: true,
                            confidence: 0,
                            currentTargetLan:fcrRttManager.getConfigInfo().getTargetLan().value,
                            currentShowDoubleLan:fcrRttManager.getConfigInfo().isShowDoubleLan()
                        },
                    ]).slice(-100);
                    fcrRttManager.showRecordList.push(fcrRttManager.allRecordList[fcrRttManager.allRecordList.length - 1])
                    fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttListChange)
                }
            }

            //判断是否修改了声源语言
            const sourceLan = config["languages"]["source"]
            if (sourceLan && operator) {
                if (fcrRttManager.rttConfigInfo.getSourceLan().value !== sourceLan || (operator.userUuid === localUser?.userUuid && fcrRttManager.localIsChangeSourceLan)) {
                    fcrRttManager.localIsChangeSourceLan = false;
                    const findData = fcrRttManager.sourceLanguageList.find(item => item.value === sourceLan);
                    if (findData) {
                        fcrRttManager.rttConfigInfo.setSourceLan(findData,true,true)
                        const languageText = transI18n(findData.text)
                        ToastApi.open({
                            toastProps: {
                                type: 'normal',
                                content: <div>{fcrRttManager.formatRoleName(operator, localUser)}{transI18n('fcr_dialog_rtt_text_change_source_language')}<span style={{ color: '#4262FF' }}>{languageText}</span></div>
                            },
                        });
                        fcrRttManager.allRecordList = fcrRttManager.allRecordList.concat([
                            {
                                uuid: uuidV4(),
                                culture: '',
                                text: `${fcrRttManager.formatRoleName(operator, localUser)}${transI18n('fcr_dialog_rtt_text_change_source_language')}${languageText}`,
                                uid: '',
                                time: 0,
                                isFinal: true,
                                confidence: 0,
                                currentTargetLan: fcrRttManager.getConfigInfo().getTargetLan().value,
                                currentShowDoubleLan:fcrRttManager.getConfigInfo().isShowDoubleLan()
                            },
                        ]).slice(-100);
                        fcrRttManager.showRecordList.push(fcrRttManager.allRecordList[fcrRttManager.allRecordList.length - 1])
                        fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttStateReceiveSourceLanChange)
                        fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttListChange)
                    }

                }
            }

            //是否开启字幕
            const subtitleState = Number(config["subtitle"])
            if(0 === subtitleState && fcrRttManager.rttConfigInfo.isOpenSubtitle()){
                //重新发起字幕开启
                this.sendRequest(fcrRttManager.rttConfigInfo)
            }
        }
    }

    //显示左上角提示弹窗
    private showNotificationOtherOpenConversion(textContent:string) {
        //通知信息处理
        notification.config({
            maxCount: 1
        });   const key = `open${Date.now()}`;
        const btn = (
          <div>
            <button style={{ padding: ' 4px 10px 4px 10px', backgroundColor: '#555B69', borderRadius: '10px', color: '#ffffff', marginRight: '10px' }} onClick={() => { notification.destroy() }}>
              {transI18n('fcr_rtt_notification_ignore')}
            </button>
            <button style={{ padding: ' 4px 10px 4px 10px', backgroundColor: '#4262FF', borderRadius: '10px', color: '#ffffff' }} onClick={() => { notification.destroy();fcrRttManager.showConversion();fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttSettingShowConversion)  }}>
              {transI18n('fcr_rtt_notification_view')}
            </button>
          </div>
        );
        notification.open({
          message: <span style={{ color: '#ffffff', paddingLeft: '20px' }}>{transI18n('fcr_rtt_button_open')}</span>,
          description: <p style={{ color: '#ffffff', paddingLeft: '20px' }}>{textContent}</p>,
          btn,
          key,
          duration: 5,
          placement: 'topLeft',
          top: 46,
          maxCount: 1,
          style: {
            background: 'rgba(47, 47, 47, 0.95)',
            color: '#ffffff',
            borderRadius: '10px'
          },
          // SvgIconEnum.FCR_V2_SUBTITIES
          icon: <div style={{ width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#16D1A4', borderRadius: '50%' }}><SvgImg type={SvgIconEnum.FCR_V2_RTT} size={36}></SvgImg></div>,
        });
    }

    /**
     * 格式化名称角色显示
     * @param optionsUser 发起设置修改的用户信息
     * @param localUser 当前本地的用户信息
     */
    formatRoleName(optionsUser: any, localUser: EduUserStruct | undefined) {
        return `${EduRoleTypeEnum.student === Number(optionsUser.role) ? transI18n('fcr_rtt_role_student') :
            EduRoleTypeEnum.teacher === Number(optionsUser.role) ? transI18n('fcr_rtt_role_teacher') : ''
            }(${optionsUser.userUuid === localUser?.userUuid ? transI18n('fcr_rtt_role_me') : optionsUser.userName})  `
    }

    //发送广播通知
    private sendBroadcat(event: AgoraExtensionRoomEvent, message?: unknown) {
        this.widgetController?.broadcast(event,message)
        switch (event) {
            case AgoraExtensionRoomEvent.RttSubtitleOpenSuccess:
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.WidgetActiveStateChange, { state: true, widgetId: "rtt" })
                break
            case AgoraExtensionRoomEvent.RttSubtitleCloseSuccess:
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.WidgetActiveStateChange, { state: false, widgetId: "rtt" })
                break
            case AgoraExtensionRoomEvent.RttConversionOpenSuccess:
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.WidgetActiveStateChange, { state: true, widgetId: "rttbox" })
                break
            case AgoraExtensionRoomEvent.RttConversionCloseSuccess:
                this.widgetController?.broadcast(AgoraExtensionRoomEvent.WidgetActiveStateChange, { state: false, widgetId: "rttbox" })
                break
            default:
                break
        }
    }

    /**
     * 显示字幕
     */
    showSubtitle() {
        if(this.loadingRequest){return}
        //消息实际处理
        fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttShowSubtitle)
        if (fcrRttManager.rttConfigInfo.isOpenSubtitle()) {
            fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttSubtitleOpenSuccess)
            fcrRttManager.rttConfigInfo.runRedceTomer()
            //消息传递后开启三秒无回调隐藏字幕
            const id = setTimeout(() => {
                fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttHideSubtitle)
            }, 3000)
            this.openSubtitleTimerList.push(id)
        } else {
            const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
            fcrRttManager.rttConfigInfo.setOpenSubtitle(true, false)
            fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttStateToOpening)
            this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
                fcrRttManager.rttConfigInfo.setOpenSubtitle(true, true)
                fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttSubtitleOpenSuccess)
                //开启消息监听
                this.addMessageListener()
                //字幕开启成功，发送文本修改
                fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttStateToListener)
                //两秒后显示当前没有人说话
                const id = setTimeout(() => {
                    fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttStateToNoSpeack)
                    //消息传递后开启三秒无回调隐藏字幕
                    const id = setTimeout(() => {
                        fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttHideSubtitle)
                    }, 3000)
                    this.openSubtitleTimerList.push(id)

                }, 2000)
                this.openSubtitleTimerList.push(id)
            })?.catch((data) => {
                if (data.codeList && data.codeList.length > 0 && "100004" === data.codeList[0]) {
                    fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttReduceTimeChange, { reduce: 0, sum: fcrRttManager.rttConfigInfo.experienceDefTime, reduceTimeStr: fcrRttManager.rttConfigInfo.formatReduceTime() })
                    //消息传递后开启三秒无回调隐藏字幕
                    const id = setTimeout(() => {
                        fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttHideSubtitle)
                    }, 3000)
                    this.openSubtitleTimerList.push(id)
                } else {
                    fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttHideSubtitle)
                }
                fcrRttManager.rttConfigInfo.setOpenSubtitle(config.isOpenSubtitle(), false)
            })
        }
    }
    /**
     * 关闭字幕
     */
    closeSubtitle() {
        if(this.loadingRequest){return}
        const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
        fcrRttManager.rttConfigInfo.setOpenSubtitle(false, false)
        this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
            fcrRttManager.rttConfigInfo.setOpenSubtitle(false, true)
            fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttConversionCloseSuccess)
        })?.catch(() => {
            fcrRttManager.rttConfigInfo.setOpenSubtitle(config.isOpenSubtitle(), false)
        })
    }

    /**
     * 显示转写
     */
    showConversion() {
        if(this.loadingRequest){return}
        //消息实际处理
        fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttShowConversion)
        if (fcrRttManager.rttConfigInfo.isOpenTranscribe()) {
            fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttConversionOpenSuccess)
            fcrRttManager.rttConfigInfo.runRedceTomer()
        } else {
            const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
            fcrRttManager.rttConfigInfo.setOpenTranscribe(true, false)
            this.localIsChangeTranscribeState = true;
            this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
                fcrRttManager.rttConfigInfo.setOpenTranscribe(true, true)
                fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttConversionOpenSuccess)
            })?.catch(() => {
                fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttConversionCloseSuccess)
                fcrRttManager.rttConfigInfo.setOpenTranscribe(config.isOpenTranscribe(), false)
            })
        }
    }
    /**
     * 关闭转写
     */
    closeConversion() {
        if(this.loadingRequest){return}
        fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttCloseConversion)
        const config: FcrRttConfig = fcrRttManager.rttConfigInfo.copy()
        fcrRttManager.rttConfigInfo.setOpenTranscribe(false, false)
        this.localIsChangeTranscribeState = true;
        this.sendRequest(fcrRttManager.rttConfigInfo)?.then(() => {
            fcrRttManager.rttConfigInfo.setOpenTranscribe(false, true)
            fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttConversionCloseSuccess)
        })?.catch(() => {
            fcrRttManager.rttConfigInfo.setOpenTranscribe(config.isOpenTranscribe(), false)
        })
    }

    //体验时间结束
    experienceFinish(){
        fcrRttManager.rttConfigInfo.setOpenTranscribe(false, true)
        fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttConversionCloseSuccess)
        fcrRttManager.rttConfigInfo.setOpenSubtitle(false, true)
        fcrRttManager.sendBroadcat(AgoraExtensionRoomEvent.RttSubtitleCloseSuccess)
    }

    //当前用户是否是在分组中
    isInSubRoom(){
        return !!fcrRttManager.classroomStore?.groupStore.currentSubRoom
    }

    /**
     * 获取显示的源文本信息
     * @param current 当前item元素
     * @param enableShowDoubleLan 是否显示双语
     * @param sourceLanValue 源语言类型
     * @param targetLanValue 翻译语言类型
     * @returns
     */
    getShowText(current: FcrRttItem | undefined, enableShowDoubleLan: boolean, sourceLanValue: string, targetLanValue: string) {
        if (!current) {
            return [null, null]
        }
        //是否设置了翻译语言
        const enableTargetLan = targetLanValue && "" !== targetLanValue
        //声源语言
        const sourceText = current?.text;
        //翻译语言
        const translateText = current?.trans?.find((item) => {
            return item.culture === targetLanValue && "" !== targetLanValue;
        })?.text;
        //语言显示
        const leve2Text = enableShowDoubleLan && enableTargetLan && sourceLanValue !== targetLanValue ? translateText : null
        const leve1Text = !enableShowDoubleLan && enableTargetLan ? translateText : sourceText;
        return [leve1Text,leve2Text];
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
            sessionInfo:{roomUuid}
            //@ts-ignore
        } = window.EduClassroomConfig;
        const data = {
            languages: {
                source: config.getSourceLan().value,
                target: config.getTargetLanList().filter((item, index) => config.getTargetLanList().indexOf(item) === index && "" !== item.value).map(item => item.value),
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
    private removeBroadCaseListener(){
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttSourceLan,
            onMessage(message:string) {
                fcrRttManager.setCurrentSourceLan(message,true)
            },
        })
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttTargetLan,
            onMessage(message:string) {
                fcrRttManager.setCurrentTargetLan(message,true)
            },
        })
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttTextSize,
            onMessage(message:number) {
                fcrRttManager.setCurrentTextSize(message,true)
            },
        })
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.ChangeRttShowDoubleLan,
            onMessage(message:boolean) {
                fcrRttManager.setShowDoubleLan(message,true)
            },
        })
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.RttChangeToSubtitleOpenState,
            onMessage() {
                if (fcrRttManager.getConfigInfo().isOpenSubtitle()) {
                    fcrRttManager.closeSubtitle()
                }else{
                    fcrRttManager.showSubtitle()
                }
            },
        })
        this.widgetController?.removeBroadcastListener({
            messageType: AgoraExtensionRoomEvent.RttChangeToConversionOpenState,
            onMessage() {
                if (fcrRttManager.getConfigInfo().isOpenTranscribe()) {
                    fcrRttManager.closeConversion()
                }else{
                    fcrRttManager.showConversion()
                }
            },
        })
    }

}
//@ts-ignore
window.fcrRttManager = new FcrRttManager()
//@ts-ignore
export const fcrRttManager:FcrRttManager = window.fcrRttManager;