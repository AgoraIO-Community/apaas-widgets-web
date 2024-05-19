import classNames from 'classnames'
import React, { useEffect } from 'react'
import { useI18n } from 'agora-common-libs';
import { useStore } from '../../../../hooks/useStore';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import './index.css'
const ApplicationDialog = ({ setIsShowApplication }: {setIsShowApplication: (arg0: boolean) => void}) => {
    const transI18n = useI18n();
    const {
        roomStore: { isLandscape,   forceLandscape, },
    } = useStore();
    const handleClose = () => {
        setIsShowApplication(false);
    }
    useEffect(() => {
        document.body.addEventListener('click', handleClose, false);
    }, [])
    const handleSelectApplication = (e: { stopPropagation: () => void; }) => {
        e.stopPropagation()
    }
  return (
    <div className={classNames('fcr-chatroom-mobile-application', isLandscape && 'active')}>
        <div className='fcr-chatroom-mobile-application-split'></div>
        <div className='fcr-chatroom-mobile-application-lists'>
            <div className='fcr-chatroom-mobile-application-list'onClick={handleSelectApplication}>
                <div className='fcr-chatroom-mobile-application-list-left'>
                    <div className='fcr-chatroom-mobile-application-list-icon'>
                        <SvgImgMobile
                            type={SvgIconEnum.APPLICATION_WHITEBOARD}
                            size={30}
                            landscape={isLandscape}
                            forceLandscape={forceLandscape}/>
                    </div>
                    <span className='fcr-chatroom-mobile-application-list-val'>Whiteboard</span>
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
            </div>
        </div>
    </div>
  )
}
export default ApplicationDialog