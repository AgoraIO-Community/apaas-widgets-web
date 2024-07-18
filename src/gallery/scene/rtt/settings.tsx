import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { transI18n } from './transI18n';

export const RttSettings = ({
  target,
  onTargetChanged,
  viewRtt,
  onShowTranslateChanged
}: {
  showTranslate: boolean;
  source: string;
  target: string;
  viewRtt: () => void;
  onShowTranslateChanged: (enableTranslate: boolean) => void;
  onTargetChanged: (target: string) => void;
}) => {
  const targetItems = [
    { label: '不翻译', value: '' },
    { label: '中文', value: 'zh-CN' },
    { label: '英文', value: 'en-US' },
    { label: '日语', value: 'ja-JP' },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState(target);
  const [showBilingual, setShowBilingual] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [sourceLanguageId, setSourceLanguageId] = useState(localStorage.getItem("sourceLanguageId") || 'zh-CN');
  const [translateLanguageId, setTranslateLanguageId] = useState(localStorage.getItem("translatelanguageId") || 'zh-CN');
  const [horizontalValue, setHorizontalValue] = useState(localStorage.getItem("subtitleFontSize") || '14');
  const handleHorizontalChange = (value) => {
    setHorizontalValue(value);
    localStorage.setItem("subtitleFontSize", value);

  };
  return (
    <div className="settings-container">
      <div className="settings-section">
        <label className="settings-label">字幕设置</label>
        <div className="settings-option">
          <span>声源语言:</span>
          <RttSettingsSelect
            items={targetItems}
            value={sourceLanguageId}
            onChange={(value: any) => {
              setSourceLanguageId(value);
              localStorage.setItem("sourceLanguageId", value);
              onTargetChanged(value);
            }}
          />

        </div>
        <div className="settings-option">
          <span>翻译语言:</span>
          <RttSettingsSelect
            items={targetItems}
            value={translateLanguageId}
            onChange={(value: any) => {
              setTranslateLanguageId(value);
              localStorage.setItem("translatelanguageId", value);
              onTargetChanged(value);
            }}
          />

        </div>

        <div className="settings-option" onClick={() => {setShowBilingual(!showBilingual);onShowTranslateChanged}}>
          <span>同时显示双语</span>
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
        <label className="settings-label">字号大小</label>
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
        恢复默认字号
      </button>
      <button className="real-time-button" onClick={viewRtt}>
        查看实时转写...
      </button>
    </div>
  );
};

const RttSettingsSelect = ({
  items,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="select-container">
      <div className="select-value" onClick={() => setIsOpen(!isOpen)}>
        {items.find((item: { value: any; }) => item.value === value)?.label || '选择语言'}
      </div>
      {isOpen && (
        <div className="select-options">
          {items.map((item: { value: React.Key | null | undefined; label: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; }) => (
            <div
              key={item.value}
              className={classnames('select-option', { 'selected': item.value === value })}
              onClick={() => {
                onChange(item.value);
                setIsOpen(false);
              }}
            >
              {item.label}
              {item.value === value && <SvgImg
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
