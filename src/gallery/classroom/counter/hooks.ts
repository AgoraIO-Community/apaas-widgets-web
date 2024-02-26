import { MobXProviderContext } from 'mobx-react';
import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PluginStore } from './store';
import { AgoraCountdown } from '.';
import RewardSound from './assets/countdown.mp3';

export enum CountdownStatus {
  STOPPED = 0,
  RUNNING = 1,
  PAUSED = 2,
}

export type pluginContext = Record<string, PluginStore>;

export const usePluginStore = (): PluginStore => {
  const context = useContext<pluginContext>(MobXProviderContext);
  return context.store;
};

// 获取当前时间
// const getCurrentTimestamp = () => (window.performance ? performance.now() : Date.now());
export const useTimeCounter = (widget: AgoraCountdown) => {
  const timer = useRef<number>(0);
  const { extra } = widget.roomProperties;
  const [duration, setDuration] = useState<number>(extra.duration || 0);
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

  const step = useCallback(() => {
    setDuration(() => {
      const newCurrent = calcRemoteDuration();
      if (newCurrent < 5 && newCurrent >= 0) {
        const audioElement = new Audio(RewardSound);
        audioElement.play();
      }
      return newCurrent;
    });
  }, []);

  const play = useCallback(() => {
    stop();
    step();
    function recursiveTimeout() {
      timer.current = requestAnimationFrame(() => {
        step();
        recursiveTimeout();
      });
    }
    recursiveTimeout();
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(timer.current);
  }, []);

  const reset = useCallback(() => {
    if (timer.current) {
      cancelAnimationFrame(timer.current);
      setDuration((_) => 0);
    }
  }, []);

  const pause = useCallback(() => {
    cancelAnimationFrame(timer.current);
    setDuration(calcRemoteDuration());
  }, []);

  const followRemoteStatus = useCallback((remoteStatus: CountdownStatus) => {
    if (remoteStatus === CountdownStatus.RUNNING) {
      play();
    }
    if (remoteStatus === CountdownStatus.STOPPED) {
      reset();
    }
    if (remoteStatus === CountdownStatus.PAUSED) {
      pause();
    }
  }, []);
  useEffect(() => {
    if (!duration || duration <= 0) {
      reset();
      return;
    }
    followRemoteStatus(extra.state);
  }, [extra.state, duration]);
  // useEffect(() => {
  //   (!duration || duration <= 0) && reset();
  // }, [duration]);

  return {
    duration: extra.state === CountdownStatus.STOPPED ? 0 : duration,
    setDuration,
    play,
    stop,
    reset,
  };
};
