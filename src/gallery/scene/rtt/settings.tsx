import React, { useEffect, useState } from 'react';
import { runInAction } from 'mobx';
import classnames from 'classnames';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
// import { transI18n } from './transI18n';
import { Modal } from 'antd';
import { fcrRttManager } from '../../../common/rtt/rtt-manager';
import { transI18n } from 'agora-common-libs';
import { AgoraExtensionRoomEvent } from '../../../events';
import { FcrRTTWidget } from '.';
import { FcrRttLanguageData } from '../../../common/rtt/rtt-config';

export const RttSettings = ({
  widget,
  showToSubtitleSetting,
  showToConversionSetting,
  targetClassName,
}: {
  widget: FcrRTTWidget;
  showToSubtitleSetting: boolean;//是否显示打开字幕设置
  showToConversionSetting: boolean;//是否显示打开转写设置
  targetClassName: string;//目标弹窗的className
}) => {
  const [sourceLan, setSourceLan] = useState<FcrRttLanguageData>(fcrRttManager.getConfigInfo().getSourceLan());
  const [targetLan, setTargetLan] = useState<FcrRttLanguageData>(fcrRttManager.getConfigInfo().getTargetLan());
  const [showBilingual, setShowBilingual] = useState(fcrRttManager.getConfigInfo().isShowDoubleLan());
  const [horizontalValue, setHorizontalValue] = useState(fcrRttManager.getConfigInfo().getTextSize());
  const [isShowSetting, setIsShowSetting] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);//控制二次确认源语言弹层显示
  const [preSourceLan, setPreSourceLan] = useState<FcrRttLanguageData>(new FcrRttLanguageData("", ""));//要修改的目标源语言
  const [showSelectType, setShowSelectType] = useState<string>();//设置显示的子选项

  //初始化处理
  useEffect(() => {
    if (isShowSetting) {
      const configInfo = fcrRttManager.getConfigInfo()
      setSourceLan(configInfo.getSourceLan())
      setTargetLan(configInfo.getTargetLan())
      setHorizontalValue(configInfo.getTextSize())
      setShowBilingual(configInfo.isShowDoubleLan())
    }
  }, [isShowSetting])

  //监听处理
  useEffect(() => {
    //源语言改变完成
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttSourceLanChangeFinish,
      onMessage: (message: { config: unknown, value: FcrRttLanguageData }) => {
        setSourceLan(message.value)
      }
    });
    //源语言改变完成
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttTargetLanChangeFinish,
      onMessage: (message: { config: unknown, value: FcrRttLanguageData }) => {
        setTargetLan(message.value)
      }
    });
    //文本大小改变完成
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RttTextSizeChagneFinish,
      onMessage: (message: { config: unknown, value: number }) => {
        setHorizontalValue(message.value);
      }
    });
  }, [])

  //隐藏所有弹窗
  const hideAllModule = () => {
    setIsModalOpen(false)
    setIsShowSetting(false)
  }

  return (
    <div>
      <div className="settings-container" style={{ display: isShowSetting ? 'block' : 'none' }}>
        <div className="settings-section">
          <label className="settings-label">{transI18n('fcr_subtitles_button_subtitles_setting')}</label>
          <div className="settings-option">
            <span>{transI18n('fcr_subtitles_label_original_audio')}:</span>
            <RttSettingsSelect
              items={fcrRttManager.sourceLanguageList}
              targetClassName={targetClassName}
              currentLan={sourceLan}
              isOpen={'sourceLan' == showSelectType}
              openSelect={()=>{setShowSelectType('sourceLan' == showSelectType ? "" :'sourceLan')}}
              onSelectLang={(lan: FcrRttLanguageData) => { runInAction(() => { setPreSourceLan(lan); hideAllModule(); setIsModalOpen(true); }) }}
            />
            <SvgImg type={SvgIconEnum.FCR_ARROW_RIGHT}
              size={24}
              colors={{ iconPrimary: 'white', iconSecondary: 'white' }}></SvgImg>
          </div>
          <div className="settings-option">
            <span>{transI18n('fcr_subtitles_label_translate_audio')}:</span>
            <RttSettingsSelect
              items={fcrRttManager.targetLanguageList}
              targetClassName={targetClassName}
              currentLan={targetLan}
              isOpen={'targetLan' == showSelectType}
              openSelect={()=>{setShowSelectType('targetLan' == showSelectType ? "" :'targetLan')}}
              onSelectLang={(lan: FcrRttLanguageData) => { runInAction(() => { fcrRttManager.setCurrentTargetLan(lan.value, true); setTargetLan(lan); }) }}
            />
            <SvgImg type={SvgIconEnum.FCR_ARROW_RIGHT}
              size={24}
              colors={{ iconPrimary: 'white', iconSecondary: 'white' }}></SvgImg>
          </div>
          <div className="settings-option" style={{ paddingRight: '2px' }} onClick={() => { runInAction(() => { fcrRttManager.setShowDoubleLan(!showBilingual, true); setShowBilingual(!showBilingual); }) }}>
            <span>{transI18n('fcr_subtitles_option_translation_display_bilingual')}</span>
            {showBilingual && <SvgImg
              type={SvgIconEnum.FCR_CHOOSEIT}
              size={24}
              colors={{ iconPrimary: 'white', iconSecondary: 'white' }}></SvgImg>}
          </div>
          <label className="settings-label">{transI18n('fcr_device_option_font_size')}</label>
          <div className="settings-option-textSize">
            <input
              type="range"
              min="10"
              max="30"
              step="1"
              value={horizontalValue}
              onChange={(e) => { runInAction(() => { fcrRttManager.setCurrentTextSize(Number(e.target.value), true); setHorizontalValue(Number(e.target.value)); }) }}
            />
          </div>
        </div>
        <button className="restore-button" onClick={() => { runInAction(() => { fcrRttManager.resetAllConfig(); hideAllModule(); }) }}>
          {transI18n('fcr_device_option_reset_font_size')}
        </button>
        {showToConversionSetting && <button className="real-time-button" onClick={() => { runInAction(() => { fcrRttManager.showConversion(); hideAllModule(); }) }}>
          {transI18n('fcr_device_option_view_rtt_open_conversion')}
        </button>}
        {showToSubtitleSetting && <button className="real-time-button" onClick={() => { runInAction(() => { fcrRttManager.showSubtitle(); hideAllModule(); }) }}>
          {transI18n('fcr_device_option_view_rtt_open_subtitle')}
        </button>}
      </div>
      <Modal title={transI18n('fcr_device_option_change_sourc')} open={isModalOpen} width={415} zIndex={9999}
        okText={transI18n('fcr_modal_okText')} onOk={() => { runInAction(() => { fcrRttManager.setCurrentSourceLan(preSourceLan.value, true); hideAllModule(); setSourceLan(preSourceLan); }) }} cancelText={(transI18n('fcr_modal_cancelText'))} onCancel={() => { hideAllModule() }}>
        <p>{transI18n('fcr_device_option_choose_lang_content_1')}<span style={{ color: '#4262FF' }}>{transI18n(preSourceLan.text)}</span>{transI18n('fcr_device_option_choose_lang_content_2')}</p>
      </Modal>
    </div>
  );
};

const RttSettingsSelect = ({
  items,
  currentLan,
  onSelectLang,
  targetClassName,
  isOpen,
  openSelect
}: {
  items: FcrRttLanguageData[],
  currentLan: FcrRttLanguageData,
  onSelectLang: (item: FcrRttLanguageData) => void;
  targetClassName: string;
  isOpen: boolean;
  openSelect: () => void;
}) => {
  const [showRight, setShowRight] = useState(false);//控制选择框的显示

  //开启选择
  const openSelectClick = () => {
    if (!isOpen) {
      setShowRight(document.body.getBoundingClientRect().right - document.getElementsByClassName(targetClassName)[0].getBoundingClientRect().right < 100)
    }
    openSelect()
  }

  return (
    <div className="select-container">
      <div className="select-value" onClick={() => openSelectClick()}>
        {transI18n(currentLan.text) || transI18n('fcr_device_option_choose_lang')}
      </div>
      {isOpen && (
        <div className="select-options" style={{ left: showRight ? 'unset' : '140%', right: showRight ? '200%' : 'unset' }}>
          {items.map((item => {
            return <div
              key={item.value}
              className={classnames('select-option')}
              onClick={() => {
                onSelectLang(item)
                openSelect()
              }}>
              {transI18n(item.text) || transI18n('fcr_device_option_choose_lang')}
              {item.value === currentLan.value && <SvgImg
                type={SvgIconEnum.FCR_CHOOSEIT}
                size={24}
                colors={{ iconPrimary: 'white', iconSecondary: 'white' }}></SvgImg>}
            </div>
          }))
          }
        </div>
      )}
    </div>
  );
};
