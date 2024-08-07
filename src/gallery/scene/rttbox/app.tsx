import { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { FcrRttboxWidget } from '.';
import './app.css';
import { Avatar } from '@components/avatar';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { transI18n } from 'agora-common-libs';
import { Input } from '@components/input';
import { notification } from 'antd';
import './NotificationStyle.css';
import { fcrRttManager } from '../../../common/rtt/rtt-manager';
import { FcrRttItem } from 'src/common/rtt/rtt-item';



export type WebviewInterface = {
  refresh: () => void;
};

export const RttBoxComponet = observer(({ widget }: { widget: FcrRttboxWidget }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const rttContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  //滑动到底部处理
  useEffect(() => {
    if (rttContainerRef.current) {
      rttContainerRef.current.scrollTop = rttContainerRef.current.scrollHeight;
    }
  }, [widget.goToScrollToBottom])

  //通知信息处理
  notification.config({
    maxCount: 1
  });
  useEffect(() => {
    if (widget.openNotification) {
      const key = `open${Date.now()}`;
      const btn = (
        <div>
          <button style={{ padding: ' 4px 10px 4px 10px', backgroundColor: '#555B69', borderRadius: '10px', color: '#ffffff', marginRight: '10px' }} onClick={() => { notification.destroy() }}>
            {transI18n('fcr_rtt_notification_ignore')}
          </button>
          <button style={{ padding: ' 4px 10px 4px 10px', backgroundColor: '#4262FF', borderRadius: '10px', color: '#ffffff' }} onClick={() => { notification.destroy() }}>
            {transI18n('fcr_rtt_notification_view')}

          </button>
        </div>
      );
      notification.open({
        message: <span style={{ color: '#ffffff', paddingLeft: '20px' }}>{transI18n('fcr_rtt_button_open')}</span>,
        description: <p style={{ color: '#ffffff', paddingLeft: '20px' }}>{widget.openNotification}</p>,
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
        onClose: () => console.log('Notification was closed.'),
      });
    }
  }, [widget.openNotification])
  //时间格式化
  const formatMillisecondsToDateTime = (milliseconds: number): string => {
    if (milliseconds == 0) {
      return ""
    }
    const date = new Date(milliseconds);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以要加1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  //配置信息
  const configInfo = fcrRttManager.getConfigInfo();
  //是否设置了翻译语言
  const enableTargetLan = configInfo.getTargetLan() && "" !== configInfo.getTargetLan().value
  //筛选结果列表
  const filteredRttList = widget.rttList.filter(item => item.text.includes(searchQuery) || (item.trans && item.trans.some(transItem => transItem.text.includes(searchQuery))));
  //没条数据查找到的数量
  const fillterdCountList = filteredRttList.map((item) => { const match = item.text.match(new RegExp(`(${searchQuery})`, 'gi')); return match ? match.length : 0; })
  useEffect(() => {
    if (searchQuery == '') {
      setTotalResults(0);
      setCurrentIndex(0)
      return
    }
    const a = countMatches(filteredRttList, searchQuery)
    setTotalResults(a);
  }, [filteredRttList]);

  //数量匹配
  const countMatches = (list: FcrRttItem[], query: string) => {
    return list.reduce((count: number, item: FcrRttItem) => {
      let itemCount = 0;
      if (item.text.includes(query)) {
        itemCount += (item.text.match(new RegExp(query, 'gi')) || []).length;
      }
      if (item.trans) {
        item.trans.forEach((transItem: { text: string; }) => {
          if (transItem.text.includes(query)) {
            itemCount += (transItem.text.match(new RegExp(query, 'gi')) || []).length;
          }
        });
      }

      return count + itemCount;
    }, 0);
  };

  //高亮匹配
  const renderHighlightedText = (text: string, currIndex: number) => {
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    //获取前面所有查到的数据
    let lastSum = 0;
    for (let index = 0; index < currIndex; index++) {
      lastSum += fillterdCountList[index];
    }
    let textIndexOf = -1
    return (
      <span>
        {parts.map((part, index) => {
          textIndexOf = textIndexOf + (part.toLowerCase() === searchQuery.toLowerCase() && part ? 1 : 0)
          return part.toLowerCase() === searchQuery.toLowerCase() && part ? (
            <span key={index} className={textIndexOf + lastSum === currentIndex ? "highlighted-current" : "highlighted"}>{part}</span>
          ) : (
            part
          )
        }
        )}
      </span>
    );
  };

  //获取显示的文本
  const getShowText = (item: FcrRttItem, index: number, showSource: boolean, showTarget: boolean) => {
    debugger
    //是否显示源语言
    if (showSource) {
      return renderHighlightedText(item.text, index)
    }
    //是否显示翻译语言
    if (showTarget) {
      const text = item.trans?.find(transItem => transItem.culture === item.currentTargetLan && "" !== item.currentTargetLan)?.text
      if (text) {
        return renderHighlightedText(text, index)
      }
    }
    return null
  }

  const handleArrowClick = (direction: string) => {
    if (direction === 'up' && currentIndex >= 1) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'down' && currentIndex < totalResults) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  return (
    // <div className="fcr-chatroom-dialog-wrapper">
    <div
      ref={rttContainerRef}
      style={{ width: widget.defaultRect.width, height: widget.defaultRect.height }}
      className="fcr-chatroom-dialog-wrapper fcr-chatroom-dialog-content">
      <div className="fcr-chatroom-dialog-title">
        <div
          className="fcr-chatroom-dialog-title-close"
          onClick={() => widget.clsoe()}>
          <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16}></SvgImg>
        </div>
        <span className='fcr-chatroom-dialog-title-text' fcr-chatroom-dialog-title>字幕</span>
      </div>
      <div className="fcr-chatroom-dialog-tab-inner">
        <div className="fcr-chatroom-member-list-search fcr-rttbox-list-search">
          <Input
            shape="rounded"
            size="medium"
            allowClear={false}
            value={searchQuery}
            onChange={setSearchQuery}
            iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
            placeholder={transI18n('fcr_chat_label_search')}
          />
          {searchQuery && <div style={{ display: 'flex', alignItems: 'center', position: 'absolute', right: '10px', top: '9px' }}>
            <div className='fcr-input-icon-clear' onClick={() => { setSearchQuery("") }}>
              <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16} />
            </div>
            <span style={{ color: '#fff' }}>{`${Math.min(currentIndex + 1, totalResults)} / ${totalResults}`}</span>
            <div className="fcrr-drop-arrow-button-box">

              <div className="fcr-drop-arrow" onClick={() => handleArrowClick('up')}>
                <SvgImg colors={{ iconPrimary: currentIndex == 0 ? 'rgba(255,255,255,0.5)' : '#ffffff' }} style={{ position: 'absolute', top: 0 }} type={SvgIconEnum.FCR_DROPUP4} onClick={() => handleArrowClick('up')}></SvgImg>
              </div>
              <div className="fcr-drop-arrow" onClick={() => handleArrowClick('down')}>
                <SvgImg colors={{ iconPrimary: currentIndex >= (totalResults - 1) ? 'rgba(255,255,255,0.5)' : '#ffffff' }} style={{ position: 'absolute', bottom: 0 }} type={SvgIconEnum.FCR_DROPDOWN4}></SvgImg>
              </div>

            </div>
          </div>}
        </div>
        {widget.isRunoutTime && <div className="fcr-limited-time-experience">
          <div className="fcr-limited-box-title">{transI18n('fcr_limited_time_experience')}</div>
          {transI18n('fcr_dialog_rtt_subtitles_dialog_time_limit_end', {
            reason1: widget.countdownDef / 60,
          })}
        </div>}
        {!widget.isRunoutTime && <div className="fcr-limited-time-experience">
          <div className="fcr-limited-box-title">{transI18n('fcr_limited_time_experience')}</div>
          {transI18n('fcr_dialog_rtt_subtitles_dialog_time_limit_reduce', {
            reason1: widget.countdownDef / 60,
            reason2: widget.countdown,
          })}
        </div>}
        {!widget.isRunoutTime && <div className="rtt-list" style={{ paddingBottom: '30px' }}>
          {filteredRttList.map((item, index) => {
            const userInfo = widget.classroomStore.streamStore.streamByStreamUuid.get(String(item.uid));
            return <div key={index}>
              {item.uid && <div key={item.uuid} className="fcr-rtt-widget-text" style={{ backgroundColor: 'rgba(0,0,0,0)' }}>
                <Avatar textSize={14} size={30} nickName={userInfo ? userInfo.fromUser.userName : ""}></Avatar>
                <div>
                  <div>
                    <div style={{ fontSize: '12PX', display: 'inline-block' }} className="fcr-rtt-widget-name">{widget.classroomStore.streamStore.streamByStreamUuid.get(String(item.uid))?.fromUser.userName}</div>
                    <div style={{ fontSize: '12PX', display: 'inline-block', color: '#BBBBBB', paddingLeft: '7px' }} >{formatMillisecondsToDateTime(item.time)}</div>
                  </div>
                  <div className="fcr-rtt-widget-translate">{getShowText(item, index, true, false)}</div>
                  <div className="fcr-rtt-widget-transcribe">
                    {getShowText(item, index, false, true)}
                  </div>
                </div>
              </div>}
              {!item.uid && <div style={{ textAlign: 'center' }}>
                <div className="open-language">{getShowText(item, index, true, false)}</div>
              </div>}
            </div>
          })}

        </div>}
        <div className="footer">
          {widget.showTranslate && <button className="stop-button" style={{ backgroundColor: 'rgba(0,0,0,0)', border: '1px solid' }} onClick={() => fcrRttManager.closeConversion()}>{transI18n('fcr_rtt_stop_transcription')}</button>}
          {!widget.showTranslate && <button className="stop-button" onClick={() => { fcrRttManager.showConversion() }}>{transI18n('fcr_rtt_start_transcription')}</button>}
          <div className='fcr_rtt_settings_show'></div>
        </div>
      </div>
    </div>
  );
});

export const App = observer(({ widget }: { widget: FcrRttboxWidget }) => {
  return <RttBoxComponet widget={widget} />;
});