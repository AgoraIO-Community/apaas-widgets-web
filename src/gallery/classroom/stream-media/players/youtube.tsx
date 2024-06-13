import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { FcrStreamMediaPlayerWidget } from '..';
import { StreamMediaPlayerInterface } from '../type';
import './index.css';
import { PlayerSync } from './sync';
import Plyr from 'plyr';
import { useI18n } from 'agora-common-libs';
export const YoutubePlayer = observer(
  forwardRef<StreamMediaPlayerInterface, { widget: FcrStreamMediaPlayerWidget }>(function P(
    { widget }: { widget: FcrStreamMediaPlayerWidget },
    ref,
  ) {
    const [isTriggeredPlay, setIsTriggeredPlay] = useState(
      !/iPad|iPhone|iPod/.test(navigator.userAgent),
    );
    const transI18n = useI18n();
    const domRef = useRef<HTMLDivElement>(null);
    const syncRef = useRef<PlayerSync | null>(null);
    const iframeContainerRef = useRef<HTMLIFrameElement>(null);
    const webViewUrl = useMemo(
      () => decodeURIComponent(widget.webviewUrl || ''),
      [widget.webviewUrl],
    );
    const createPlayer = (ref: HTMLElement) => {
      if (!syncRef.current) {
        syncRef.current = new PlayerSync(widget);
        syncRef.current.setupPlayer(
          new Plyr(ref, {
            fullscreen: { enabled: false },
            controls: ['play', 'progress', 'current-time', 'mute', 'volume'],
            clickToPlay: false,
          }),
        );
      }
    };
    useEffect(() => {
      if (domRef.current) {
        createPlayer(domRef.current);
      }
      return () => {
        syncRef.current?.destroy();
      };
    }, []);
    return (
      <div
        style={{ position: 'relative', width: '100%', height: '100%' }}
        className={widget.hasPrivilege ? '' : 'player-not-controlled'}>
        {!isTriggeredPlay && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (syncRef.current && syncRef.current.isPlayerSetup) {
                syncRef.current.play();
                if (!widget.state?.isPlaying) {
                  syncRef.current.pause();
                }
                setIsTriggeredPlay(true);
              }
            }}
            className="fcr-mobile-auto-play-failed-btn-ytb">
            {transI18n('fcr_H5_click_to_play')}
          </div>
        )}

        <div
          ref={iframeContainerRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}></div>
        <div
          ref={domRef}
          data-plyr-provider="youtube"
          data-plyr-embed-id={webViewUrl}
          style={{
            pointerEvents: widget.hasPrivilege ? 'auto' : 'none',
          }}></div>
      </div>
    );
  }),
);
