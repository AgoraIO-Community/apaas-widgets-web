import { useState, useEffect, useRef } from 'react';
import { autorun } from 'mobx';
import { FcrCountdownWidget } from '.';
import { AgoraExtensionRoomEvent } from '../../../events';
import { TimeFormat } from './app';
import dayjs from 'dayjs';
import RewardSound from './assets/countdown.mp3';

type UseCountdownReturnType = {
  current: number;
  start: () => void;
  stop: () => void;
  pause: () => void;
  status: CountdownStatus;
};
export enum CountdownStatus {
  STOPPED = 0,
  RUNNING = 1,
  PAUSED = 2,
}
const calcRemoteDuration = (widget: FcrCountdownWidget) => {
  const { extra } = widget.roomProperties;

  const serverTimeCalcByLocalTime =
    Date.now() + widget.classroomStore.roomStore.clientServerTimeShift;
  const duration = extra
    ? extra?.startTime
      ? extra?.duration
        ? extra.duration - Math.floor(Math.abs(serverTimeCalcByLocalTime - extra.startTime) / 1000)
        : 0
      : extra.duration
    : 0;
  return Math.max(duration, 0);
};
export const useCountdown = (
  widget: FcrCountdownWidget,
  remoteStatus: CountdownStatus,
): UseCountdownReturnType => {
  const [status, setStatus] = useState(remoteStatus);
  const [current, setCurrent] = useState(calcRemoteDuration(widget));
  const requestRef = useRef<number>(0);

  const animate = () => {
    let newCurrent = calcRemoteDuration(widget);
    if (newCurrent < 5 && newCurrent >= 0) {
      const audioElement = new Audio(RewardSound);
      audioElement.play();
    }
    if (newCurrent <= 0) {
      stop();
      newCurrent = 0;
    }

    setCurrent(newCurrent);
    if (newCurrent > 0) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const start = () => {
    setStatus(CountdownStatus.RUNNING);
    cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);
  };

  const pause = () => {
    setStatus(CountdownStatus.PAUSED);
    cancelAnimationFrame(requestRef.current);
  };
  const stop = () => {
    setStatus(CountdownStatus.STOPPED);
    setCurrent(0);
    cancelAnimationFrame(requestRef.current);
  };
  const followRemoteStatus = (remoteStatus: CountdownStatus) => {
    if (remoteStatus === CountdownStatus.RUNNING) {
      start();
    }
    if (remoteStatus === CountdownStatus.STOPPED) {
      stop();
    }
    if (remoteStatus === CountdownStatus.PAUSED) {
      pause();
    }
  };

  useEffect(() => {
    followRemoteStatus(remoteStatus);
    return () => {
      requestRef.current && cancelAnimationFrame(requestRef.current);
    };
  }, [remoteStatus]);

  return { current: Math.ceil(current), start, stop, pause, status };
};

export const useCountdownRemoteStatus = (widget: FcrCountdownWidget) => {
  const [status, setStatus] = useState(CountdownStatus.STOPPED);
  const [duration, setDuration] = useState(0);
  const [totalDuration, setTotalDuration] = useState(
    widget.roomProperties.extra?.totalDuration || 0,
  );
  useEffect(() => {
    return autorun(() => {
      const { extra } = widget.roomProperties;
      if (extra) {
        setDuration(calcRemoteDuration(widget));
        if (extra.totalDuration) {
          setTotalDuration(extra.totalDuration || 0);
        }
        setStatus(extra.state);
      }
    });
  }, []);
  return {
    duration,
    setDuration,
    totalDuration,
    setTotalDuration,
    status,
  };
};
export const useCountdownMinimized = (widget: FcrCountdownWidget) => {
  const [minimized, setMinimized] = useState(false);
  useEffect(() => {
    widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.SetMinimize,
      onMessage: ({ widgetId, minimized }: { widgetId: string; minimized: boolean }) => {
        if (widgetId === widget.widgetId) {
          setMinimized(minimized);
        }
      },
    });
  }, []);
  return { minimized };
};

export const timeToSeconds = (time: TimeFormat) => {
  return dayjs
    .duration({
      minutes: time.tensOfMinutes * 10 + time.minutes,
      seconds: time.tensOfSeconds * 10 + time.seconds,
    })
    .asSeconds();
};
