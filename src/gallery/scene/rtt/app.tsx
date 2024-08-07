import React, { forwardRef, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { FcrRTTWidget } from '.';
import loadingPng from './loading.png';
import './app.css';
import { Avatar } from '@components/avatar';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import classnames from 'classnames';
import { Popover, PopoverWithTooltip } from '@components/popover';
import { RttSettings } from './settings';
import { AgoraExtensionRoomEvent } from '../../../events';
import { transI18n } from 'agora-common-libs';
import ReactDOM from 'react-dom';
import { fcrRttManager } from '../../../common/rtt/rtt-manager';
import { FcrRttItem } from '../../../common/rtt/rtt-item';
import { ToastApi } from '@components/toast';

export type WebviewInterface = {
  refresh: () => void;
};

export const RttComponet = observer(({ widget }: { widget: FcrRTTWidget }) => {
  const [mouseHover, setMouseHover] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const rttContainerRef = useRef<HTMLDivElement>(null);
  const rttOptionsWidgetRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (rttContainerRef.current) {
      rttContainerRef.current.scrollTop = rttContainerRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [widget.rttList]);

  useEffect(() => {
    widget.setVisible(true)
  }, [widget.rttVisible, widget.rttList, widget.starting, widget.visibleView]);

  //设置视图配置信息
  interface SettingViewProps {
    buttonView: ReactNode | null;
    showToConversionSetting: boolean;
    showToSubtitleSetting: boolean;
  }
  //设置视图
  const SettingView: React.FC<SettingViewProps> = ({ showToConversionSetting, showToSubtitleSetting }) => {
    return <RttSettings widget={widget} showToConversionSetting={showToConversionSetting} showToSubtitleSetting={showToSubtitleSetting}></RttSettings>
  }
  
  const active = mouseHover || popoverVisible;

  //配置信息
  const configInfo = fcrRttManager.getConfigInfo();
  //是否设置了翻译语言
  const enableTargetLan = configInfo.getTargetLan() && "" !== configInfo.getTargetLan().value
  //是否开启了双语
  const enableShowDoubleLan = configInfo.isShowDoubleLan()
  //最后一条消息
  const lastItem = enableTargetLan ? widget.rttList.findLast((item) => {
    return !!item.trans?.find((item) => {
      return item.culture === configInfo.getTargetLan().value  && "" !== configInfo.getTargetLan().value;
    });
  }) : widget.rttList[widget.rttList.length - 1];
  //最后一条姓名信息
  const lastItemName = widget.classroomStore.streamStore.streamByStreamUuid.get(String(lastItem?.uid),)?.fromUser.userName;
  //声源语言
  const sourceText = lastItem?.text;
  //翻译语言
  const translateText = lastItem?.trans?.find((item) => {
    return item.culture === configInfo.getTargetLan().value  && "" !== configInfo.getTargetLan().value;
  })?.text;
  //语言显示
  const leve2Text = enableShowDoubleLan && enableTargetLan ? translateText : null
  const leve1Text = !enableShowDoubleLan && enableTargetLan ? translateText : sourceText;
 //字幕box当前宽度
 const limitBoxWidth = document.getElementsByClassName('fcr-limited-box')?.length > 0 ? document.getElementsByClassName('fcr-limited-box')[0]?.getBoundingClientRect()?.width : 0;
 
  //操作按钮区域
  const rttOptionsWidget = useMemo(() => {
    return <div className="fcr-rtt-widget-actions">
      <ToolTip content={transI18n('fcr_subtitles_button_subtitles_setting')}>
        <PopoverWithTooltip
          popoverProps={{
            onVisibleChange: setPopoverVisible,
            content: (<SettingView buttonView={undefined} showToConversionSetting={true} showToSubtitleSetting={false} ></SettingView>),
            placement: 'top',
            overlayInnerStyle: { width: 175 },
          }}
          toolTipProps={{ content: transI18n('fcr_subtitles_button_subtitles_setting') }}>
          <div className="fcr-rtt-widget-action">
            <SvgImg type={SvgIconEnum.FCR_TRANSLATE} size={24}></SvgImg>
          </div>
        </PopoverWithTooltip>
      </ToolTip>
      <ToolTip content={transI18n('fcr_subtitles_button_subtitles_close')}>
        <div onClick={() => fcrRttManager.closeSubtitle()} className="fcr-rtt-widget-action fcr-rtt-widget-close">
          <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16}></SvgImg>
        </div>
      </ToolTip>
    </div>
  }, [rttOptionsWidgetRef]);

  return (
    <div style={{ display: widget.visibleView && (widget.starting || widget.listening || widget.noOnespeakig || widget.isRunoutTime || leve1Text || leve2Text) ? 'block' : 'none', paddingBottom: '14px' }}
      ref={rttContainerRef}>
      <div>
        {widget.isRunoutTime && <div className="fcr-limited-box">
          <div className="fcr-limited-box-title">{transI18n('fcr_limited_time_experience')}</div>
          {transI18n(limitBoxWidth < 460 ? 'fcr_dialog_rtt_subtitles_dialog_time_limit_end_ellipsis' : 'fcr_dialog_rtt_subtitles_dialog_time_limit_end', {
            reason1: widget.countdownDef / 60,
          })}
        </div>}
        {!widget.isRunoutTime &&
          <div className="fcr-limited-box">
            <div className="fcr-limited-box-title">{transI18n('fcr_limited_time_experience')}</div>
            {transI18n(limitBoxWidth < 460 ? 'fcr_dialog_rtt_subtitles_dialog_time_limit_reduce_ellipsis' : 'fcr_dialog_rtt_subtitles_dialog_time_limit_reduce', {
              reason1: widget.countdownDef / 60,
              reason2: widget.countdown,
            })}
          </div>}
      </div>
      <div className={classnames('fcr-rtt-subtitle-content', 'fcr-bg-black-a80', {
        'fcr-bg-2-a50': !active,
        'fcr-border-transparent': !active,
        'fcr-border-brand': active,
      })}
        onMouseEnter={() => setMouseHover(true)}
        onMouseLeave={() => setMouseHover(false)}>
        {rttOptionsWidget}
        <div>
          {/* 开启中 */}
          {widget.starting && !widget.isRunoutTime && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
              <img src={loadingPng} style={{ width: '20px', height: '20px', marginRight: '10px', verticalAlign: 'middle', animation: 'rotate 1s linear infinite', }}></img>
              {transI18n('fcr_subtitles_text_turn_on')} ...
            </div>
          )}
          {widget.isRunoutTime && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
              {transI18n('fcr_dialog_rtt_time_limit_status_empty')}
            </div>
          )}
          {/* 正在聆听 */}
          {widget.listening && !widget.starting && !widget.noOnespeakig && !widget.isRunoutTime && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
              <SvgImg type={SvgIconEnum.FCR_V2_HEAR} size={16} style={{ verticalAlign: 'middle', marginRight: '10px', marginBottom: '4px' }}></SvgImg>
              {transI18n('fcr_subtitles_text_listening')} ...
            </div>
          )}
          {/* 没有人正在说话 */}
          {widget.noOnespeakig && !widget.starting && !(leve1Text || leve2Text) && !widget.isRunoutTime && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
              {transI18n('fcr_subtitles_text_no_one_speaking')}
            </div>
          )}
        </div>

        {(leve1Text || leve2Text) && !widget.listening && !widget.starting && !widget.noOnespeakig && !widget.isRunoutTime && (
          <div className="fcr-rtt-widget-text">
            <Avatar textSize={14} size={30} nickName={lastItemName ? lastItemName : ""}></Avatar>
            <div>
              <div className="fcr-rtt-widget-name">{lastItemName}:</div>
              <div className="fcr-rtt-widget-transcribe" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
                {leve1Text}
              </div>
              {(
                <div className="fcr-rtt-widget-translate" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>{leve2Text}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
});

export const App = observer(({ widget }: { widget: FcrRTTWidget }) => {
  return <RttComponet widget={widget} />;
});
