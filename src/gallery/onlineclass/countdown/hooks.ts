import { useState, useEffect, useRef } from 'react';
import { autorun } from 'mobx';
import { FcrCountdownWidget } from '.';
import { AgoraExtensionRoomEvent } from '../../../events';
import { TimeFormat } from './app';
import dayjs from 'dayjs';
import RewardSound from './assets/countdown.mp3';

type UseCountdownReturnType = {
  current: number;
  start: (startTime?: number) => void;
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
  widget: FcrCountdownWidget,
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

  const start = (startTime: number = duration) => {
    if (startTime > 0) {
      setCurrent(startTime);
      currentRef.current = startTime;
      setStatus(CountdownStatus.RUNNING);
      prevTimeRef.current = performance.now();
      requestRef.current && cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(animate);
    }
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
    if (!widget.hasPrivilege) {
      followRemoteStatus(remoteStatus);
    }
  }, [remoteStatus, duration]);
  useEffect(() => {
    setCurrent(duration);
    currentRef.current = duration;
    followRemoteStatus(remoteStatus);
    return () => {
      requestRef.current && cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return { current: Math.ceil(current), start, stop, pause, status };
};

export const useCountdownRemoteStatus = (widget: FcrCountdownWidget) => {
  const checkRemoteStarted = () => {
    const { extra } = widget.roomProperties;
    if (!extra?.startTime) return false;
    const serverTimeCalcByLocalTime =
      Date.now() + widget.classroomStore.roomStore.clientServerTimeShift;
    const direction = serverTimeCalcByLocalTime - (extra.startTime + extra.duration * 1000); // 判断方向
    return direction < 0;
  };
  const formatRemoteStatus = () => {
    const formatedStatus = widget.roomProperties.extra?.state as number;
    return formatedStatus !== CountdownStatus.PAUSED
      ? checkRemoteStarted()
        ? CountdownStatus.RUNNING
        : CountdownStatus.STOPPED
      : CountdownStatus.PAUSED;
  };
  const calcRemoteDuration = () => {
    const { extra } = widget.roomProperties;

    const serverTimeCalcByLocalTime =
      Date.now() + widget.classroomStore.roomStore.clientServerTimeShift;
    const duration = extra?.duration
      ? extra.duration - Math.floor(Math.abs(serverTimeCalcByLocalTime - extra.startTime) / 1000)
      : 0;
    return duration;
  };

  const [status, setStatus] = useState(formatRemoteStatus());
  const [duration, setDuration] = useState(calcRemoteDuration());
  const [totalDuration, setTotalDuration] = useState(
    widget.roomProperties.extra?.totalDuration || 0,
  );
  useEffect(() => {
    return autorun(() => {
      const { extra } = widget.roomProperties;
      if (extra?.startTime) {
        if (checkRemoteStarted()) {
          const duration = calcRemoteDuration();
          setDuration(duration);
        }
      } else {
        setDuration(extra?.duration || 0);
      }
      if (extra?.totalDuration) {
        setTotalDuration(extra?.totalDuration || 0);
      }
      setStatus(formatRemoteStatus());
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
