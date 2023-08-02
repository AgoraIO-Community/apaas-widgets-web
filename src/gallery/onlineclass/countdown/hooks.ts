import { useState, useEffect, useRef } from 'react';
import { autorun } from 'mobx';
import { FcrCountdownWidget } from '.';
import { AgoraExtensionRoomEvent } from '../../../events';

type UseCountdownReturnType = {
  current: number;
  start: () => void;
  stop: () => void;
  pause: () => void;
  status: CountdownStatus;
};
export enum CountdownStatus {
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}
export const countdownRmoteStatusMap = {
  0: CountdownStatus.STOPPED,
  1: CountdownStatus.RUNNING,
  2: CountdownStatus.PAUSED,
};
export const useCountdown = (
  duration: number,
  initialStatus: CountdownStatus,
): UseCountdownReturnType => {
  const [status, setStatus] = useState(initialStatus);
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
      if (newCurrent <= 0) {
        stop();
        newCurrent = 0;
      }
      setCurrent(newCurrent);
      currentRef.current = newCurrent;
      prevTimeRef.current = currentTime;
    }
    if (currentRef.current > 0) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const start = () => {
    if (duration > 0) {
      setStatus(CountdownStatus.RUNNING);
      prevTimeRef.current = performance.now();
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
  useEffect(() => {
    setCurrent(duration);
    currentRef.current = duration;
  }, [duration]);

  useEffect(() => {
    return () => {
      requestRef.current && cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return { current: Math.ceil(current), start, stop, pause, status };
};

export const useCountdownRemoteStatus = (widget: FcrCountdownWidget) => {
  const [duration, setDuration] = useState(widget.roomProperties.extra?.duration || 0);
  const [totalDuration, setTotalDuration] = useState(
    widget.roomProperties.extra?.totalDuration || 0,
  );
  const [status, setStatus] = useState(
    countdownRmoteStatusMap[
      widget.roomProperties.extra?.state as keyof typeof countdownRmoteStatusMap
    ] || CountdownStatus.STOPPED,
  );

  useEffect(() => {
    return autorun(() => {
      const { extra } = widget.roomProperties;
      if (extra) {
        const { extra } = widget.roomProperties;

        if (extra.startTime) {
          const serverTimeCalcByLocalTime =
            Date.now() + widget.classroomStore.roomStore.clientServerTimeShift;
          const direction = serverTimeCalcByLocalTime - (extra.startTime + extra.duration * 1000); // 判断方向

          if (direction < 0) {
            const duration =
              extra.duration -
              Math.floor(Math.abs(serverTimeCalcByLocalTime - extra.startTime) / 1000);
            setDuration(duration);
          }
        } else {
          setDuration(extra.duration || 0);
        }

        if (extra.totalDuration) {
          setTotalDuration(extra.totalDuration || 0);
        }
        setStatus(countdownRmoteStatusMap[extra.state as keyof typeof countdownRmoteStatusMap]);
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
