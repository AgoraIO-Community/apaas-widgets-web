import { useState, useEffect, useRef, useCallback } from 'react';
import { autorun } from 'mobx';
import { FcrCountdownWidget } from '.';
import { AgoraExtensionRoomEvent } from '../../../events';
import { TimeFormat } from './app';
import dayjs from 'dayjs';
import RewardSound from './assets/countdown.mp3';
let animationFrameId: number;
let animationing = false;
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
  const updateCurrent = () => {
    const newCurrent = calcRemoteDuration(widget);
    setCurrent(newCurrent <= 0 ? 0 : newCurrent);
    return newCurrent;
  };
  const animate = () => {
    updateCurrent();
    if (animationing) {
      animationFrameId = requestAnimationFrame(animate);
    }
  };

  const start = () => {
    setStatus(CountdownStatus.RUNNING);
    animationing = true;
    animate();
  };
  const pause = () => {
    setStatus(CountdownStatus.PAUSED);
    updateCurrent();
  };
  const stop = () => {
    setStatus(CountdownStatus.STOPPED);
    updateCurrent();
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
    if (status === CountdownStatus.RUNNING && current <= 5 && current > 0) {
      const audioElement = new Audio(RewardSound);
      audioElement.play();
    }
  }, [current, status]);
  useEffect(() => {
    cancelAnimationFrame(animationFrameId);
    animationing = false;
    followRemoteStatus(remoteStatus);
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
