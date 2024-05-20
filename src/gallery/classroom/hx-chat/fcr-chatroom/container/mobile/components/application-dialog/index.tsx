import classNames from 'classnames'
import React, { useEffect, useMemo } from 'react'
import { useStore } from '../../../../hooks/useStore';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import './index.css'
const ApplicationDialog = ({ setIsShowApplication }: {setIsShowApplication: (arg0: boolean) => void}) => {
    const {
        roomStore: { isLandscape,   forceLandscape, z0Widgets, setCurrentWidget, currentWidget },
    } = useStore();
    const widgets = useMemo(() => z0Widgets.filter((v) => v.widgetName !== 'easemobIM'),[z0Widgets])
    const handleClose = () => {
        setIsShowApplication(false);
    }
    useEffect(() => {
        document.body.addEventListener('click', handleClose, false);
    }, [])
    const handleSelectApplication = (e: { stopPropagation: () => void; }, widget: any) => {
        e.stopPropagation()
        setCurrentWidget(widget)
    }
  return (
    <div className={classNames('fcr-chatroom-mobile-application', isLandscape && 'active')}>
        <div className='fcr-chatroom-mobile-application-split'></div>
        <div className='fcr-chatroom-mobile-application-lists'>
            {
                widgets.map((item) => {
                    return (
                        <div key={item.widgetId} className='fcr-chatroom-mobile-application-list'onClick={(e) => handleSelectApplication(e, item)}>
                            <div className='fcr-chatroom-mobile-application-list-left'>
                                <div className={classNames('fcr-chatroom-mobile-application-list-icon', item.widgetName === 'mediaPlayer' && 'video', item.widgetName === 'webView' && 'bower')}>
                                   {item.widgetName === 'netlessBoard' && <SvgImgMobile
                                        type={SvgIconEnum.APPLICATION_WHITEBOARD}
                                        size={30}
                                        landscape={isLandscape}
                                        forceLandscape={forceLandscape}/>}
                                    {item.widgetName === 'mediaPlayer' && <SvgImgMobile
                                        type={SvgIconEnum.APPLICATION_VIDEO}
                                        size={30}
                                        landscape={isLandscape}
                                        forceLandscape={forceLandscape}/>}
                                     {item.widgetName === 'webView' && <SvgImgMobile
                                        type={SvgIconEnum.APPLICATION_BOWER}
                                        size={30}
                                        landscape={isLandscape}
                                        forceLandscape={forceLandscape}/>}
                                </div>
                                {(item.widgetName === 'netlessBoard' || item.widgetName === 'mediaPlayer') && <span className='fcr-chatroom-mobile-application-list-val'>{item.widgetName === 'netlessBoard' ? 'Whiteboard' : item.widgetName === 'mediaPlayer' ? 'Youtube' : ''}</span>}
                                {
                                    item.widgetName === 'webView' && <div className='fcr-chatroom-mobile-application-list-content'>
                                     <span className='fcr-chatroom-mobile-application-list-title'>网页</span>
                                     <span className='fcr-chatroom-mobile-application-list-des'>{item?.displayName || ''}</span>
                                    </div>
                                }
                            </div>
                            <div className='fcr-chatroom-mobile-application-list-right'>
                               {currentWidget && currentWidget.widgetId === item.widgetId ? <SvgImgMobile
                                    type={SvgIconEnum.CHAT_SELECT}
                                    size={20}
                                    landscape={isLandscape}
                                    forceLandscape={forceLandscape}/> : <span className='fcr-chatroom-mobile-application-list-unselect'></span>}
                            </div>
                        </div>
                    )
                })
            }
          
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
    </div>
  )
}
export default ApplicationDialog