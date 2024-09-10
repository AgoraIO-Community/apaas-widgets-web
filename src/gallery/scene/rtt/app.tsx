import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { FcrRTTWidget } from '.';
import loadingPng from './loading.png';
import './app.css';
import { Avatar } from '@components/avatar';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import classnames from 'classnames';
import { PopoverWithTooltip } from '@components/popover';
import { transI18n } from 'agora-common-libs';
import { fcrRttManager } from '../../../common/rtt/rtt-manager';

export type WebviewInterface = {
  refresh: () => void;
};

export const RttComponet = observer(({ widget }: { widget: FcrRTTWidget }) => {
  const [mouseHover, setMouseHover] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const rttContainerRef = useRef<HTMLDivElement>(null);
  const rttExperienceRef = useRef<HTMLDivElement>(null);
  const rttContentRef = useRef<HTMLDivElement>(null);
  const rttOptionsWidgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    widget.setVisible(true)
  }, [widget.rttVisible, widget.starting, widget.visibleView]);

  const active = mouseHover || popoverVisible;

  //配置信息
  const configInfo = fcrRttManager.getConfigInfo();
  //最后一条消息
  const lastItem = widget.lastRecord;
  //获取显示的文本信息
  const showTextList = lastItem ? fcrRttManager.getShowText(lastItem, configInfo.isShowDoubleLan(), configInfo.getSourceLan().value, configInfo.getTargetLan() && configInfo.getTargetLan().value) : [null, null]
  //最后一条姓名信息
  const lastItemName = widget.classroomStore.streamStore.streamByStreamUuid.get(String(lastItem?.uid),)?.fromUser.userName;
  const leve2Text = showTextList[1]
  const leve1Text = showTextList[0]
  //字幕box当前宽度
  let limitBoxWidth = rttContainerRef.current?.getBoundingClientRect().width;
  limitBoxWidth = limitBoxWidth && limitBoxWidth > 0 ? limitBoxWidth : 750

  //操作按钮区域
  const rttOptionsWidget = useMemo(() => {
    const targetPopClassRoom = "fcr-rtt-widget-actions-" + Math.random()
    return <div className={`${targetPopClassRoom} fcr-rtt-widget-actions`}>
      <ToolTip content={transI18n('fcr_subtitles_button_subtitles_setting')}>
        <PopoverWithTooltip
          popoverProps={{
            onVisibleChange: setPopoverVisible,
            content: (widget.getRttSettingView(true, false, targetPopClassRoom,()=>{setPopoverVisible(false)})),
            // content: (<SettingView buttonView={undefined} showToConversionSetting={true} showToSubtitleSetting={false} ></SettingView>),
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

  useEffect(() => {
    const exHeight = rttExperienceRef?.current?.getBoundingClientRect()?.height
    const contentHeight = rttContentRef?.current?.getBoundingClientRect()?.height
    if (rttContainerRef.current) {
      let parent = rttContainerRef.current.offsetParent as HTMLElement;
      if (parent) {
        parent = parent.offsetParent as HTMLElement;
        if (parent) {
          parent = parent.offsetParent as HTMLElement;
          if (parent) {
            parent.style.height = ((exHeight ? exHeight : 0) + (contentHeight ? contentHeight : 0)) + "px"
          }
        }
      }
    }
  }, [rttContentRef.current?.getBoundingClientRect().height]);


  return (
    <div style={{
      display: widget.visibleView && (widget.starting || widget.listening || widget.noOnespeakig || widget.isRunoutTime || leve1Text && lastItemName || leve2Text) ? 'flex' : 'none',
    }} ref={rttContainerRef} className='fcr-rtt-subtitle-drag-handle'>
      <div ref={rttExperienceRef}>
        {widget.isRunoutTime && <div className="fcr-rtt-subtitle-experience-container">
          <div className="title">{transI18n('fcr_limited_time_experience')}</div>
          {transI18n(limitBoxWidth < 460 ? 'fcr_dialog_rtt_subtitles_dialog_time_limit_end_ellipsis' : 'fcr_dialog_rtt_subtitles_dialog_time_limit_end', {
            reason1: widget.countdownDef / 60,
          })}
        </div>}
        {!widget.isRunoutTime && <div className="fcr-rtt-subtitle-experience-container">
          <div className="title">{transI18n('fcr_limited_time_experience')}</div>
          {transI18n(limitBoxWidth < 460 ? 'fcr_dialog_rtt_subtitles_dialog_time_limit_reduce_ellipsis' : 'fcr_dialog_rtt_subtitles_dialog_time_limit_reduce', {
            reason1: widget.countdownDef / 60,
            reason2: widget.countdown,
          })}
        </div>}
      </div>
      <div className={classnames('fcr-rtt-subtitle-content-container', 'fcr-bg-black-a80', {
        'fcr-bg-2-a50': !active,
        'fcr-border-transparent': !active,
        'fcr-border-brand': active,
      })} ref={rttContentRef}
        onMouseEnter={() => setMouseHover(true)}
        onMouseLeave={() => setMouseHover(false)}>
        {rttOptionsWidget}
        <div>
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
          {widget.listening && !widget.starting && !widget.noOnespeakig && !widget.isRunoutTime && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
              <SvgImg type={SvgIconEnum.FCR_V2_HEAR} size={16} style={{ verticalAlign: 'middle', marginRight: '10px', marginBottom: '4px' }}></SvgImg>
              {transI18n('fcr_subtitles_text_listening')} ...
            </div>
          )}
          {widget.noOnespeakig && !widget.starting && !(leve1Text || leve2Text) && !widget.isRunoutTime && (
            <div className="fcr-text-2 fcr-text-center fcr-w-full fcr-flex-center" style={{ fontSize: fcrRttManager.getConfigInfo().getTextSize() + "px", lineHeight: (fcrRttManager.getConfigInfo().getTextSize() + 4) + "px" }}>
              {transI18n('fcr_subtitles_text_no_one_speaking')}
            </div>
          )}
        </div>
        {(leve1Text || leve2Text) && !widget.listening && !widget.starting && !widget.noOnespeakig && !widget.isRunoutTime && (
          <div className="fcr-rtt-subtitle-widget-text">
            <Avatar textSize={14} size={30} nickName={lastItemName ? lastItemName : ""}></Avatar>
            <div style={{ paddingLeft: 10 }}>
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