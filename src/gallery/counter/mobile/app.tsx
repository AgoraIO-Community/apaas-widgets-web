import React, { useEffect } from 'react';
import { usePluginStore, useTimeCounter } from '../hooks';
import { observer } from 'mobx-react';
import FlipClock from './flip-clock';
import { autorun } from 'mobx';
import { AgoraCountdown } from '..';
import './index.css';
const App = observer(({ widget }: { widget: AgoraCountdown }) => {
  const pluginStore = usePluginStore();
  const { duration, setDuration, play } = useTimeCounter();
  const durationRef = React.useRef<number>(duration);
  const [caution, setCaution] = React.useState(false);

  useEffect(() => {
    return autorun(() => {
      const { extra } = widget.roomProperties;
      if (extra && extra.startTime) {
        const serverTimeCalcByLocalTime = Date.now() + pluginStore.getTimestampGap;
        const direction = serverTimeCalcByLocalTime - (extra.startTime + extra.duration * 1000); // 判断方向
        if (direction < 0) {
          const duration =
            extra.duration -
            Math.floor(Math.abs(serverTimeCalcByLocalTime - extra.startTime) / 1000);
          setDuration(duration);
          play();
          pluginStore.setShowSetting(false);
        }
      }
    });
  }, []);

  React.useEffect(() => {
    if (durationRef.current !== duration && duration < 3) {
      setCaution(true);
    } else {
      setCaution(false);
    }
    durationRef.current = duration;
  }, [duration]);
  return (
    <div
      className={`fcr-countdown-mobile  ${
        pluginStore.isLandscape ? 'fcr-countdown-mobile-landscape' : ''
      } ${pluginStore.landscapeToolBarVisible ? '' : 'fcr-countdown-mobile-landscape-right'}`}>
      <FlipClock duration={duration} caution={!pluginStore.showSetting && caution} />
    </div>
  );
});

export default App;
