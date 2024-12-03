import { transI18n, useI18n } from 'agora-common-libs';
import { observer } from 'mobx-react';
import { CSSProperties, forwardRef, ReactNode, useEffect } from 'react';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import { useStore } from '../../../../hooks/useStore';

import './index.css';
export const RoomInfoContainer = observer(
  forwardRef<
    HTMLDivElement | null,
    {
      children?: ReactNode;
      style?: CSSProperties;
      landscape?: boolean;
      classNames?: string;
    }
  >(function Container({ children, style, landscape = false, classNames = '' }, ref) {
    const {
      messageStore: { announcement, showAnnouncement },
    } = useStore();

    return (
      <div
        ref={ref}
        className={`fcr-mobile-interact-container${landscape ? '-landscape' : ''} ${classNames}`}
        style={{ ...style }}>
        <>
          {!landscape && (
            <div className="fcr-mobile-interact-container-top">
              <div className="fcr-mobile-interact-container-placeholder"></div>
              {
                <div
                  className="fcr-chatroom-mobile-announcement"
                  style={{
                    height: announcement && showAnnouncement ? 'auto' : '0px',
                    ...(announcement && showAnnouncement ? {} : { paddingBottom: '0px' }),
                  }}>
                  <span>{transI18n('chat.announcement')}</span>
                  <span>{announcement}</span>
                </div>
              }
            </div>
          )}
          <RoomInfo landscape={landscape} />
          {children}
        </>
      </div>
    );
  }),
);

const RoomInfo = observer(({ landscape = false }: { landscape?: boolean }) => {
  const {
    messageStore: { showAnnouncement, setShowAnnouncement, announcement },
    roomStore: {
      classStatusText,
      forceLandscape,
      quitForceLandscape,
      roomName,
      landscapeToolBarVisible,
    },
    userStore: { teacherName },
  } = useStore();
  const transI18n = useI18n();
  useEffect(() => {
    setShowAnnouncement(!!announcement);
  }, [announcement]);
  return landscape ? (
    <div
      style={{
        visibility: landscapeToolBarVisible ? 'visible' : 'hidden',
        opacity: landscapeToolBarVisible ? 1 : 0,
        transition: 'visibility .2s, opacity .2s',
      }}>
      <div className="fcr-mobile-landscape-inter-mask-top"></div>
      <div className="fcr-mobile-landscape-inter-mask-bottom"></div>
      <div className="fcr-mobile-landscape-inter-room-info">
        <div className="fcr-mobile-landscape-inter-room-info-left">
          {forceLandscape && (
            <div className="fcr-mobile-landscape-inter-room-info-back" onClick={quitForceLandscape}>
              <SvgImgMobile
                forceLandscape={forceLandscape}
                landscape={landscape}
                colors={{ iconPrimary: '#fff' }}
                type={SvgIconEnum.COLLAPSE}
                size={24}></SvgImgMobile>
            </div>
          )}
          <div className="fcr-mobile-landscape-inter-room-info-room">
            <div className="fcr-mobile-landscape-inter-room-info-teacher">
              <FcrLogo></FcrLogo>
              <div>
                <div className="fcr-mobile-landscape-inter-room-info-teacher-name">
                  {teacherName}
                </div>
                <div className="fcr-mobile-landscape-inter-room-info-teacher-fcr">
                  {transI18n('fcr_h5_label_logo')}
                </div>
              </div>
            </div>
            <div className="fcr-mobile-landscape-inter-room-info-hot">
              <FcrHot></FcrHot>
            </div>
          </div>
        </div>

        <div className="fcr-mobile-landscape-inter-room-info-name">
          <div>{roomName}</div>
          <div>{classStatusText}</div>
        </div>
      </div>
    </div>
  ) : (
    <div className="fcr-mobile-inter-room-info">
      <div className="fcr-mobile-inter-room-info-left">
        <FcrLogo></FcrLogo>
        {teacherName && (
          <div className="fcr-mobile-inter-room-info-teacher-name">
            <span>{transI18n('chat.teacher')}:</span>
            <span>{teacherName}</span>
          </div>
        )}
        <FcrHot></FcrHot>
      </div>
      <div className="fcr-mobile-inter-room-info-right">
        <div className="fcr-mobile-inter-room-info-start-time">{classStatusText}</div>
        {announcement && (
          <div
            className="fcr-mobile-inter-room-info-toggle-announcement"
            onClick={() => {
              setShowAnnouncement(!showAnnouncement);
            }}>
            <SvgImgMobile
              forceLandscape={forceLandscape}
              landscape={landscape}
              style={{ transform: `rotate(${showAnnouncement ? '180deg' : '0deg'})` }}
              type={SvgIconEnum.DOUBLE_ARROW_DOWN}
              size={12}></SvgImgMobile>
          </div>
        )}
      </div>
    </div>
  );
});
export const FcrLogo = observer(() => {
  const {
    roomStore: { isLandscape, forceLandscape },
  } = useStore();
  return (
    <div className="fcr-mobile-inter-room-info-logo">
      <SvgImgMobile
        forceLandscape={forceLandscape}
        landscape={isLandscape}
        type={SvgIconEnum.FCR_LOGO}
        size={34}></SvgImgMobile>
    </div>
  );
});
export const FcrHot = observer(() => {
  const {
    roomStore: { isLandscape, userCount, forceLandscape },
  } = useStore();
  const transI18n = useI18n();
  return (
    <div className="fcr-mobile-inter-room-info-hot">
      <SvgImgMobile
        forceLandscape={forceLandscape}
        landscape={isLandscape}
        type={SvgIconEnum.HOT}
        size={20}></SvgImgMobile>{' '}
      <span>
        {userCount} {transI18n('fcr_h5_label_watched')}
      </span>
    </div>
  );
});
