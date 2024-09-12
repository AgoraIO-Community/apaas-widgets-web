import { useI18n, getLanguage } from 'agora-common-libs';
import { observer } from 'mobx-react';
import { useEffect, useRef, useState } from 'react';
import { SvgIconEnum, SvgImgMobile } from '../../../../components/svg-img';
import { usePluginStore } from '../hooks';
import './index.css';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
const keepDecimals = (value: number, count = 0) => {
  const reg = new RegExp(`^(-)*(\\d+)(\\.\\d{0,${count}}).*$`);
  return Number(`${value}`.replace(reg, '$1$2$3'));
};
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const [isShow, setIsShow] = useState<boolean>(true);
  const timer = useRef<NodeJS.Timeout>();
  const timer1 = useRef<NodeJS.Timeout>();
  useEffect(() => {
    const language = getLanguage()
    setWidth(language === 'en' ? 32 : 49) 
  }, [])
  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    if (timer1.current) {
      clearTimeout(timer1.current);
    }
    timer.current = setTimeout(() => {
      setWidth(0)
    }, 3000);
    timer1.current = setTimeout(() => {
      setIsShow(false)
    }, 3200);
    return () => {
      clearTimeout(timer.current);
      clearTimeout(timer1.current);
    };
  }, [])
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
  useEffect(() => () => setIsSubmitting(false), []);
  const handleSubmit = async () => {
    if (isSubmitBtnDisabled) {
      addSubmitToast();
      return;
    }
    if (isSubmitting) {
      return;
    }
    try {
      setIsSubmitting(true);
      await handleSubmitVote([...selectedOptions]);
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log('minimize',minimize,JSON.stringify(minimize));
  
  return minimize ? (
    <>
      {isLandscape
        ? createPortal(
            <>{landscapeToolBarVisible ? <div
              className={classNames(`fcr-mobile-poll-widget-minimize fcr-mobile-poll-widget-minimize-landscape`, !isShow && 'landmin')}
              onClick={() => {
                setMinimize(false);
              }}>
              <div className="fcr-mobile-poll-widget-minimize-icon">
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.POLL_NEW}
                  size={26}
                  ></SvgImgMobile>
              </div>
              <div className={classNames('fcr-mobile-poll-widget-minimize-content', !isShow && 'hidden')} style={{ width: `${width}px`, transition: 'width 0.2s linear'}}>
                <span>{transI18n('widget_polling.appName')}</span>
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  colors={{ iconPrimary: '#fff' }}
                  landscape={isLandscape}
                  type={SvgIconEnum.POLL}
                  size={12}></SvgImgMobile>
              </div>
              
            </div> : null}</>,
            document.querySelector('.landscape-bottom-tools')!,
          )
        : createPortal(
            <div
              className={classNames(`fcr-mobile-poll-widget-minimize active`, !isShow && 'min')}
              onClick={() => {
                setMinimize(false);
              }}>
              <div className="fcr-mobile-poll-widget-minimize-icon">
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  landscape={isLandscape}
                  type={SvgIconEnum.POLL_NEW}
                  size={26}
                  ></SvgImgMobile>
              </div>

              <div className={classNames('fcr-mobile-poll-widget-minimize-content', !isShow && 'hidden')} style={width !== null ? { width: `${width}px`, transition: 'all 0.2s linear'} : { width: 'fit-content'}}>
                <span>{transI18n('widget_polling.appName')}</span>
                <SvgImgMobile
                  forceLandscape={forceLandscape}
                  colors={{ iconPrimary: '#fff' }}
                  landscape={isLandscape}
                  type={SvgIconEnum.POLL_ICON}
                  size={12}></SvgImgMobile>
              </div>
            </div>,
            document.querySelector('.fcr-poll-mobile-widget')!,
          )}
    </>
  ) : (
    createPortal(
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
            type={SvgIconEnum.POLL_CLOSE}></SvgImgMobile>
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

                  const percentage = keepDecimals(res?.percentage * 100) + '%';
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
                {pollingResultUserCount} {transI18n('widget_polling.fcr_poll_people_participated')}
              </div>
            )}
            {!isShowResultSection && (
              <div
                onClick={handleSubmit}
                className={`fcr-mobile-poll-widget-submit ${
                  isSubmitBtnDisabled ? 'fcr-mobile-poll-widget-submit-disabled' : ''
                }`}>
                {isSubmitting ? (
                  <SvgImgMobile
                    className="fcr-button-loading"
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.FCR_BTN_LOADING}
                    size={40}></SvgImgMobile>
                ) : (
                  <SvgImgMobile
                    forceLandscape={forceLandscape}
                    landscape={isLandscape}
                    type={SvgIconEnum.TICK}
                    size={40}></SvgImgMobile>
                )}
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body,
    )
  );
});
