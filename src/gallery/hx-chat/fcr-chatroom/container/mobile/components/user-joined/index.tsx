import { observer } from 'mobx-react';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../../../hooks/useStore';
import './index.css';
const backgroundColors = ['rgba(255, 199, 0, .8)', 'rgba(106, 121, 255, .8)'];
export const UserJoined = observer(() => {
  const [bgColor, setBgColor] = useState(backgroundColors[0]);
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(-2000);
  const {
    userStore: { userCarouselAnimDelay, joinedUser },
    roomStore: { isLandscape, messageVisible },
  } = useStore();
  useEffect(() => {
    setLeft(-(ref.current?.clientWidth || 0));
    setBgColor(backgroundColors[Math.round(Math.random())]);
  }, [joinedUser]);
  return joinedUser ? (
    <div
      ref={ref}
      className={`fcr-chatroom-h5-user-joined ${
        isLandscape ? 'fcr-chatroom-h5-user-joined-landscape' : ''
      }`}
      style={{
        background: bgColor,
        animationDuration: userCarouselAnimDelay + 'ms',
        left: left,
        visibility: messageVisible || !isLandscape ? 'visible' : 'hidden',
      }}>
      {joinedUser?.nickName}&nbsp;来了👏
    </div>
  ) : null;
});
