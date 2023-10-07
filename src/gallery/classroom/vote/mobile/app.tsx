import { useI18n } from 'agora-common-libs';
import { observer } from 'mobx-react';
import { useState } from 'react';
import { SvgIconEnum, SvgImgMobile } from '../../../../components/svg-img';
import { usePluginStore } from '../hooks';
import './index.css';
export const PollH5 = observer(() => {
  const {
    minimize,
    setMinimize,
    title,
    options,
    type,
    handleSubmitVote,
    isShowResultSection,
    pollingResult,
    selectedIndexResult,
    pollingResultUserCount,
    isLandscape,
    forceLandscape,
    addSubmitToast,
    landscapeToolBarVisible,
  } = usePluginStore();
  const transI18n = useI18n();
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const handleOptionClick = (index: number) => {
    if (isShowResultSection) {
      return;
    }
    if (selectedOptions.has(index)) {
      selectedOptions.delete(index);
      setSelectedOptions(new Set([...selectedOptions]));
      return;
    }
    let newSelectedOptions = selectedOptions;
    if (type === 'checkbox') {
      if (!newSelectedOptions.has(index)) {
        newSelectedOptions.add(index);
      }
    } else {
      newSelectedOptions = new Set([index]);
    }
    setSelectedOptions(new Set([...newSelectedOptions]));
  };
  const isSubmitBtnDisabled = selectedOptions.size === 0;
  const selectedIndex = isShowResultSection ? selectedIndexResult : selectedOptions;
  const handleSubmit = () => {
    if (isSubmitBtnDisabled) {
      addSubmitToast();
      return;
    }
    handleSubmitVote([...selectedOptions]);
  };
  return minimize ? (
    <div
      className={`fcr-mobile-poll-widget-minimize ${
        isLandscape ? 'fcr-mobile-poll-widget-minimize-landscape' : ''
      }`}
      onClick={() => {
        setMinimize(false);
      }}>
      <div className="fcr-mobile-poll-widget-minimize-icon">
        <SvgImgMobile
          forceLandscape={forceLandscape}
          landscape={isLandscape}
          type={SvgIconEnum.POLL}></SvgImgMobile>
      </div>

      <span>{transI18n('widget_polling.appName')}</span>
      <SvgImgMobile
        forceLandscape={forceLandscape}
        colors={{ iconPrimary: '#000' }}
        landscape={isLandscape}
        type={SvgIconEnum.COLLAPSE}
        size={20}></SvgImgMobile>
    </div>
  ) : (
    <div
      className={`fcr-mobile-poll-widget-modal ${
        isLandscape ? 'fcr-mobile-poll-widget-modal-landscape' : ''
      }`}>
      <div
        className="fcr-mobile-poll-widget-modal-close"
        onClick={() => {
          setMinimize(true);
        }}>
        <SvgImgMobile
          forceLandscape={forceLandscape}
          landscape={isLandscape}
          type={SvgIconEnum.CLOSE}></SvgImgMobile>
      </div>
      <div className="fcr-mobile-poll-widget-modal-content">
        <div
          className="fcr-mobile-poll-widget-content"
          style={isShowResultSection ? { paddingBottom: 0 } : {}}>
          <div className="fcr-mobile-poll-widget-top">
            <div className="fcr-mobile-poll-widget-top-logo">
              <SvgImgMobile
                forceLandscape={forceLandscape}
                landscape={isLandscape}
                type={SvgIconEnum.POLL}
                size={36}></SvgImgMobile>
            </div>
            <div className="fcr-mobile-poll-widget-top-right">
              <div className="fcr-mobile-poll-widget-top-right-name">
                {transI18n('widget_polling.appName')}
              </div>
              <div className="fcr-mobile-poll-widget-top-right-desc">
                {transI18n(
                  type === 'radio' ? 'widget_polling.single-sel' : 'widget_polling.mul-sel',
                )}
              </div>
            </div>
          </div>
          <div className="fcr-mobile-poll-widget-bottom">
            <div className="fcr-mobile-poll-widget-title">{title}</div>
            <div className="fcr-mobile-poll-widget-options">
              {options.map((value, index) => {
                const isSelected = selectedIndex.has(index);
                const res = pollingResult[index];
                const percentage = res?.percentage * 100 + '%';
                return (
                  <div
                    onClick={() => handleOptionClick(index)}
                    key={value}
                    className={`fcr-mobile-poll-widget-option ${
                      isSelected ? 'fcr-mobile-poll-widget-option-selected' : ''
                    } ${isShowResultSection ? 'fcr-mobile-poll-widget-option-result' : ''}`}>
                    <p>{value}</p>
                    {isShowResultSection && (
                      <>
                        <div className="fcr-mobile-poll-widget-option-result-analys">
                          <div>{res.num}</div>
                          <div>{percentage}</div>
                        </div>
                        <div
                          className={`fcr-mobile-poll-widget-option-result-progress ${
                            isSelected
                              ? 'fcr-mobile-poll-widget-option-result-progress-selected'
                              : ''
                          }`}
                          style={{ width: percentage }}></div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {isShowResultSection && (
            <div className={`fcr-mobile-poll-widget-result-count`}>
              {pollingResultUserCount}人参与
            </div>
          )}
          {!isShowResultSection && (
            <div
              onClick={handleSubmit}
              className={`fcr-mobile-poll-widget-submit ${
                isSubmitBtnDisabled ? 'fcr-mobile-poll-widget-submit-disabled' : ''
              }`}>
              <SvgImgMobile
                forceLandscape={forceLandscape}
                landscape={isLandscape}
                type={SvgIconEnum.TICK}
                size={48}></SvgImgMobile>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
