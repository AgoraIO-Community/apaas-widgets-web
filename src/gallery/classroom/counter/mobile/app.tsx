import React, { useEffect } from 'react';
import { usePluginStore, useTimeCounter } from '../hooks';
import { observer } from 'mobx-react';
import FlipClock from './flip-clock';
import { autorun } from 'mobx';
import { AgoraCountdown } from '..';
import './index.css';
const App = observer(({ widget }: { widget: AgoraCountdown }) => {
  const pluginStore = usePluginStore();
  const { duration, setDuration } = useTimeCounter(widget);
  const durationRef = React.useRef<number>(duration);
  const [caution, setCaution] = React.useState(false);
  const calcRemoteDuration = () => {
    const { extra } = widget.roomProperties;
    const serverTimeCalcByLocalTime =
      Date.now() + widget.classroomStore.roomStore.clientServerTimeShift;
    const duration = extra?.startTime
      ? extra?.duration
        ? extra.duration - Math.floor(Math.abs(serverTimeCalcByLocalTime - extra.startTime) / 1000)
        : 0
      : extra.duration;
    return Math.max(duration, 0);
  };
  useEffect(() => {
    return autorun(() => {
      const { extra } = widget.roomProperties;
      if (extra && extra.startTime) {
        setDuration(calcRemoteDuration())
        const serverTimeCalcByLocalTime = Date.now() + pluginStore.getTimestampGap;
        const direction = serverTimeCalcByLocalTime - (extra.startTime + extra.duration * 1000); // 判断方向
        if (direction < 0) {
          pluginStore.setShowSetting(false);
        }
      }
    });
  }, []);

  React.useEffect(() => {
    if (durationRef.current !== duration && duration < 10) {
      setCaution(true);
    } else {
      setCaution(false);
    }
    durationRef.current = duration;
  }, [duration]);
  return (
    <div
      className={`fcr-countdown-mobile  ${pluginStore.isLandscape ? 'fcr-countdown-mobile-landscape' : ''
        } ${pluginStore.landscapeToolBarVisible ? '' : 'fcr-countdown-mobile-landscape-right'}`}>
      <FlipClock duration={duration} caution={!pluginStore.showSetting && caution} />
    </div>
  );
});

export default App;
