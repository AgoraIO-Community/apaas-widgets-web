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

export const useCountdown = (
  duration: number,
  remoteStatus: CountdownStatus,
): UseCountdownReturnType => {
  const [status, setStatus] = useState(remoteStatus);
  const [current, setCurrent] = useState(duration);
  const requestRef = useRef<number>();
  const prevTimeRef = useRef<number>(0);
  const intervalDuration = 1000; // 1 second
  const currentRef = useRef(duration);

  const animate = (currentTime: number) => {
    if (prevTimeRef.current === 0) {
      prevTimeRef.current = currentTime;
    }

    const elapsedTime = currentTime - prevTimeRef.current;

    if (elapsedTime >= intervalDuration) {
      let newCurrent = currentRef.current - Math.floor(elapsedTime / intervalDuration);
      if (newCurrent < 5 && newCurrent >= 0) {
        const audioElement = new Audio(RewardSound);
        audioElement.play();
      }
      if (newCurrent <= 0) {
        stop();
        newCurrent = 0;
      }

      setCurrent(newCurrent);
      currentRef.current = newCurrent;
      prevTimeRef.current = currentTime;
    }
    if (currentRef.current > 0) {
      requestRef.current && cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const start = () => {
    setStatus(CountdownStatus.RUNNING);
    prevTimeRef.current = performance.now();
    requestRef.current && cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);
  };

  const pause = () => {
    setStatus(CountdownStatus.PAUSED);
    requestRef.current && cancelAnimationFrame(requestRef.current);
  };
  const stop = () => {
    setStatus(CountdownStatus.STOPPED);
    setCurrent(0);
    requestRef.current && cancelAnimationFrame(requestRef.current);
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
    setCurrent(duration);
    currentRef.current = duration;
    followRemoteStatus(remoteStatus);
    return () => {
      requestRef.current && cancelAnimationFrame(requestRef.current);
    };
  }, [remoteStatus, duration]);

  return { current: Math.ceil(current), start, stop, pause, status };
};

export const useCountdownRemoteStatus = (widget: FcrCountdownWidget) => {
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
  const [status, setStatus] = useState(CountdownStatus.STOPPED);
  const [duration, setDuration] = useState(0);
  const [totalDuration, setTotalDuration] = useState(
    widget.roomProperties.extra?.totalDuration || 0,
  );
  useEffect(() => {
    return autorun(() => {
      const { extra } = widget.roomProperties;
      if (extra) {
        setDuration(calcRemoteDuration());
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
