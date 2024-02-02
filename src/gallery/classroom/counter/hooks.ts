import { MobXProviderContext } from 'mobx-react';
import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PluginStore } from './store';
import { AgoraCountdown } from '.';

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
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { extra } = widget.roomProperties;
  const [duration, setDuration] = useState<number>(extra.duration || 0);

  const step = useCallback(() => {
    setDuration((duration) => duration - 1);
  }, []);

  const play = useCallback(() => {
    stop();
    timer.current = setInterval(() => {
      step();
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
    }
  }, []);

  const reset = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      setDuration((_) => 0);
    }
  }, []);

  const pause = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      setDuration((duration) => duration);
    }
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
  }, [])
  useEffect(() => {
    if (!duration || duration <= 0) {
      reset()
      return
    }
    followRemoteStatus(extra.state)
  }, [extra.state, duration])
  // useEffect(() => {
  //   (!duration || duration <= 0) && reset();
  // }, [duration]);

  return { duration, setDuration, play, stop, reset };
};
