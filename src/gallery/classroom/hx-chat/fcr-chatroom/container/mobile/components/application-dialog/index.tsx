import classNames from 'classnames';
import { useEffect } from 'react';
import { useStore } from '../../../../hooks/useStore';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import './index.css';
import { observer } from 'mobx-react';
import { transI18n } from 'agora-common-libs';
import { AgoraExtensionWidgetEvent } from '../../../../../../../../../src/events';
const ApplicationDialog = observer(
  ({ setIsShowApplication }: { setIsShowApplication: (arg0: boolean) => void }) => {
    const {
      isShowPoll,
      broadcastWidgetMessage,
      roomStore: { isLandscape, forceLandscape, z0Widgets, setCurrentWidget, currentWidget },
    } = useStore();
    console.log('currentWidgetcurrentWidgetdialog', currentWidget);
    // const widgets = z0Widgets;
    const widgets = z0Widgets.filter((v: any) => v.widgetName !== 'easemobIM');
    const handleClose = () => {
      setIsShowApplication(false);
    };
    useEffect(() => {
      document.body.addEventListener('click', handleClose, false);
    }, []);
    const handleSelectApplication = (e: { stopPropagation: () => void }, widget: any) => {
      e.stopPropagation();
      setCurrentWidget(widget);
    };

    const showMinimize =(e: { stopPropagation: () => void })=>{
      e.stopPropagation();
      broadcastWidgetMessage(AgoraExtensionWidgetEvent.PollMinimizeStateChanged, false);
    }
    return (
      <div className={classNames('fcr-chatroom-mobile-application', isLandscape && 'active')}>
        <div className="fcr-chatroom-mobile-application-split"></div>
        {widgets.length>0 && <div className="frc-chatroom-modal-first-title">{transI18n('fcr_more_tip_title')}</div>}
        <div className="fcr-chatroom-mobile-application-lists">
          {widgets.map((item: any) => {
            return (
              <div
                key={item.widgetId}
                className="fcr-chatroom-mobile-application-list"
                onClick={(e) => handleSelectApplication(e, item)}>
                <div className="fcr-chatroom-mobile-application-list-left">
                  <div
                    className={classNames(
                      'fcr-chatroom-mobile-application-list-icon',
                      item.widgetName === 'netlessBoard' && 'whiteboard',
                      item.widgetName === 'mediaPlayer' && 'video',
                      item.widgetName === 'webView' && 'bower',
                      item.widgetName === 'screenShare',
                    )}>
                    {item.widgetName === 'netlessBoard' && (
                      <SvgImgMobile
                        type={SvgIconEnum.MOBILE_WHITEBOARDEDIT}
                        size={30}
                        landscape={isLandscape}
                        forceLandscape={forceLandscape}
                      />
                    )}
                    {item.widgetName === 'mediaPlayer' && (
                      <SvgImgMobile
                        type={SvgIconEnum.RECORDING_PLAY}
                        size={30}
                        landscape={isLandscape}
                        forceLandscape={forceLandscape}
                      />
                    )}
                    {item.widgetName === 'webView' && (
                      <SvgImgMobile
                        type={SvgIconEnum.INTERNET}
                        size={30}
                        landscape={isLandscape}
                        forceLandscape={forceLandscape}
                      />
                    )}
                    {item.widgetName === 'screenShare' && (
                      <SvgImgMobile
                        type={SvgIconEnum.MOBILE_SHARESCREEN}
                        size={30}
                        landscape={isLandscape}
                        forceLandscape={forceLandscape}
                      />
                    )}
                  </div>
                  {(item.widgetName === 'netlessBoard' || item.widgetName === 'mediaPlayer') && (
                    <span className="fcr-chatroom-mobile-application-list-val">
                      {item.widgetName === 'netlessBoard'
                        ? 'Whiteboard'
                        : item.widgetName === 'mediaPlayer'
                        ? item.webviewTitle
                        : ''}
                    </span>
                  )}
                  {item.widgetName === 'webView' && (
                    <div className="fcr-chatroom-mobile-application-list-content">
                      <span className="fcr-chatroom-mobile-application-list-title">网页</span>
                      <span className="fcr-chatroom-mobile-application-list-des">
                        {item?.displayName || ''}
                      </span>
                    </div>
                  )}
                  {item.widgetName === 'screenShare' && (
                    <span className="fcr-chatroom-mobile-application-list-val">
                      {transI18n('fcr_application_screen_share')}
                    </span>
                  )}
                </div>
                <div className="fcr-chatroom-mobile-application-list-right">
                  {currentWidget && currentWidget.widgetId === item.widgetId ? (
                    <SvgImgMobile
                      type={SvgIconEnum.CHAT_SELECT}
                      size={20}
                      landscape={isLandscape}
                      forceLandscape={forceLandscape}
                    />
                  ) : (
                    <span className="fcr-chatroom-mobile-application-list-unselect"></span>
                  )}
                </div>
              </div>
            );
          })}

          {/* <div className='fcr-chatroom-mobile-application-list'>
                <div className='fcr-chatroom-mobile-application-list-left'>
                    <div className='fcr-chatroom-mobile-application-list-icon video'>
                        <SvgImgMobile
                            type={SvgIconEnum.APPLICATION_VIDEO}
                            size={30}
                            landscape={isLandscape}
                            forceLandscape={forceLandscape}/>
                    </div>
                    <span className='fcr-chatroom-mobile-application-list-val'>Youtube</span>
                </div>
                <div className='fcr-chatroom-mobile-application-list-right'>
                    <SvgImgMobile
                        type={SvgIconEnum.CHAT_SELECT}
                        size={20}
                        landscape={isLandscape}
                        forceLandscape={forceLandscape}/>
                </div>
            </div>
            <div className='fcr-chatroom-mobile-application-list'>
                <div className='fcr-chatroom-mobile-application-list-left'>
                    <div className='fcr-chatroom-mobile-application-list-icon bower'>
                        <SvgImgMobile
                            type={SvgIconEnum.APPLICATION_BOWER}
                            size={30}
                            landscape={isLandscape}
                            forceLandscape={forceLandscape}/>
                    </div>
                    <div className='fcr-chatroom-mobile-application-list-content'>
                        <span className='fcr-chatroom-mobile-application-list-title'>网页</span>
                        <span className='fcr-chatroom-mobile-application-list-des'>通知提醒框noticesdscccss通知提醒框noticesdscccss...</span>
                    </div>
                </div>
                <div className='fcr-chatroom-mobile-application-list-right'>
                    <span className='fcr-chatroom-mobile-application-list-unselect'></span>
                </div>
            </div> */}
        </div>

       {isShowPoll&&<div className="frc-chatroom-modal-first-title">
              {transI18n('fcr_more_tip_second_title')}
        </div>}
        {isShowPoll&&<div className='fcr-chatroom-mobile-application-list' onClick={(e) => showMinimize(e)}>
          <div className='fcr-chatroom-mobile-application-list-icon poll'>
            <SvgImgMobile
                forceLandscape={forceLandscape}
                landscape={isLandscape}
                type={SvgIconEnum.MOBILE_VOTE}
                size={30}
                />
          </div>
          <span className='fcr-chatroom-mobile-application-list-val'>{transI18n('fcr_more_options_poll')}</span>
        </div>}
      </div>
    );
  },
);
export default ApplicationDialog;
