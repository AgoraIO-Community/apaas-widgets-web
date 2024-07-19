import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
// import { transI18n } from './transI18n';
import { Modal } from 'antd';
import { fcrRttManager } from '../../../common/rtt/rtt-manager';
import { transI18n } from 'agora-common-libs';
import { AgoraExtensionRoomEvent } from '../../../events';
import { ToastApi } from '@components/toast';

export const RttSettings = ({
  target,
  onTargetChanged,
  viewRtt,
  widget,
  onShowTranslateChanged
}: {
  showTranslate: boolean;
  source: string;
  target: string;
  widget: any;
  viewRtt: () => void;
  onShowTranslateChanged: (enableTranslate: boolean) => void;
  onTargetChanged: (target: string) => void;
}) => {
  const sourceLanguageList = fcrRttManager.sourceLanguageList;
  const targetLanguageList = fcrRttManager.targetLanguageList;

  const configInfo = fcrRttManager.getConfigInfo();
  const [selectedLanguage, setSelectedLanguage] = useState(target);
  const [showBilingual, setShowBilingual] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [sourceLanguageId, setSourceLanguageId] = useState(localStorage.getItem("sourceLanguageId") || 'zh-CN');
  const [translateLanguageId, setTranslateLanguageId] = useState(localStorage.getItem("translatelanguageId") || 'zh-CN');
  const [horizontalValue, setHorizontalValue] = useState(localStorage.getItem("subtitleFontSize") || '14');
  const [isShowSetting, setIsShowSetting] = useState(true);
// 修改字号大小
  const handleHorizontalChange = (value: number) => {
    setHorizontalValue(value);
    fcrRttManager.setCurrentTextSize(value,true)
  };
  const handelCloseSetting = () => {
    setIsShowSetting(false)
  }
  useEffect(() => {
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ChangeRttlanguage,
      onMessage: (data) => {
        console.log("接收到的数据", data)
      }
    });
  }, [])
  return (
    <div className="settings-container" style={{ display: isShowSetting ? 'block' : 'none' }}>
      <div className="settings-section">
        <label className="settings-label">{transI18n('fcr_subtitles_button_subtitles_setting')}</label>
        <div className="settings-option">
          <span>{transI18n('fcr_subtitles_label_original_audio')}:</span>
          <RttSettingsSelect
            items={sourceLanguageList}
            currentLan={configInfo.getSourceLan().text}
            onSelectLang={handelCloseSetting}
          />

        </div>
        <div className="settings-option">
          <span>{transI18n('fcr_subtitles_label_translate_audio')}:</span>
          <RttSettingsSelect
            items={targetLanguageList}
            currentLan={configInfo.getTargetLan().text}
            onSelectLang={handelCloseSetting}
          />

        </div>

        <div className="settings-option" onClick={() => {fcrRttManager.setShowDoubleLan(!showBilingual,true);setShowBilingual(!showBilingual);}}>
          <span>{transI18n('fcr_subtitles_option_translation_display_bilingual')}</span>
          {showBilingual && <SvgImg
            type={SvgIconEnum.FCR_CHOOSEIT}
            size={24}
            colors='white'></SvgImg>}
          {/* <input
            type="checkbox"
            checked={showBilingual}
            onChange={() => setShowBilingual(!showBilingual)}
          /> */}
        </div>
        <label className="settings-label">{transI18n('fcr_device_option_font_size')}</label>
        <div className="settings-option" onClick={onShowTranslateChanged}>
          <input
            type="range"
            min="10"
            max="30"
            value={horizontalValue}
            onChange={(e) => { handleHorizontalChange(e.target.value) }}
          />
          <span>{horizontalValue}px</span>
        </div>
      </div>
      <button className="restore-button" onClick={() => handleHorizontalChange(14)}>
        {transI18n('fcr_device_option_reset_font_size')}
      </button>
      <button className="real-time-button" onClick={()=>{viewRtt();handelCloseSetting()}}>
        {transI18n('fcr_device_option_view_rtt')}
      </button>
    </div>
  );
};

const RttSettingsSelect = ({
  items,
  currentLan,
  onSelectLang,
}: {
  items: any,
  currentLan: string,
  onSelectLang: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);//控制选择框的显示
  const [isModalOpen, setIsModalOpen] = useState(false);//控制弹层显示
  const [sourceLan, setSourceLan] = useState({});//设置当前源语言
  // 显示弹层
  const showModal = () => {
    setIsOpen(false);
    setIsModalOpen(true);
  };
  // 点击弹层的确认按钮
  const handleOk = () => {
    setIsModalOpen(false);
    fcrRttManager.setCurrentSourceLan(sourceLan.value, true)
    
  };
  // 点击弹层的取消按钮
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <div className="select-container">
      <div className="select-value" onClick={() => setIsOpen(!isOpen)}>
        {transI18n(currentLan) || transI18n('fcr_device_option_choose_lang')}
      </div>
      <Modal title={transI18n('fcr_device_option_change_sourc')} open={isModalOpen} width={415} okText={transI18n('fcr_modal_okText')} onOk={handleOk} cancelText={(transI18n('fcr_modal_cancelText'))} onCancel={handleCancel}>
        <p>{transI18n('fcr_device_option_choose_lang_content_1')}<span style={{ color: '#4262FF' }}>{transI18n(sourceLan.text)}</span>{transI18n('fcr_device_option_choose_lang_content_2')}</p>
      </Modal>
      {isOpen && (
        <div className="select-options">
          {items.map((item: {
            text(text: any): React.ReactNode; value: React.Key | null | undefined; label: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined;
          }) => (
            <div
              key={item.value}
              className={classnames('select-option')}
              onClick={() => {
                if (items[0].value == "") {
                  fcrRttManager.setCurrentTargetLan(item.value, true)
                } else {
                  showModal()
                  setSourceLan(item)
                }
                onSelectLang()
              }}
            >
              {transI18n(item.text) || transI18n('fcr_device_option_choose_lang')}
              {item.text === currentLan && <SvgImg
                type={SvgIconEnum.FCR_CHOOSEIT}
                size={24}
                colors='white'></SvgImg>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
