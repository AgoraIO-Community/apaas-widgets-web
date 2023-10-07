import { ChangeEventHandler, FC, useEffect, useState } from 'react';
import { FcrCountdownWidget } from '.';
import isNaN from 'lodash/isNaN';
import classnames from 'classnames';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import './app.css';
import { ToolTip } from '@components/tooltip';
import {
  CountdownStatus,
  timeToSeconds,
  useCountdown,
  useCountdownMinimized,
  useCountdownRemoteStatus,
} from './hooks';
import dayjs from 'dayjs';
import { useI18n } from 'agora-common-libs';
import { EduToolDialog } from '../common/dialog/base';
import { AgoraExtensionWidgetEvent } from '../../../events';

export type TimeFormat = {
  tensOfMinutes: number;
  minutes: number;
  tensOfSeconds: number;
  seconds: number;
};
const defaultTimeFormat: TimeFormat = {
  tensOfMinutes: 0,
  minutes: 5,
  tensOfSeconds: 0,
  seconds: 0,
};

export const FcrCountdownApp = ({ widget }: { widget: FcrCountdownWidget }) => {
  const transI18n = useI18n();
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(defaultTimeFormat);

  const { minimized } = useCountdownMinimized(widget);
  const { duration, totalDuration, status: remoteStatus } = useCountdownRemoteStatus(widget);

  const { current } = useCountdown(duration, remoteStatus);
  const isStopped = remoteStatus === CountdownStatus.STOPPED;
  const roomId = widget.classroomStore.connectionStore.scene?.sceneId || '0';
  useEffect(() => {
    const time = dayjs.duration(current * 1000);
    const minutes = time.asMinutes() || 0;
    const seconds = time.seconds() || 0;
    if (remoteStatus !== CountdownStatus.STOPPED) {
      setTimeFormat({
        tensOfMinutes: Math.floor(minutes / 10),
        minutes: Math.floor(minutes % 10),
        tensOfSeconds: Math.floor(seconds / 10),
        seconds: Math.floor(seconds % 10),
      });
    } else {
      widget.hasPrivilege
        ? setTimeFormat(defaultTimeFormat)
        : setTimeFormat({
            tensOfMinutes: 0,
            minutes: 0,
            tensOfSeconds: 0,
            seconds: 0,
          });
    }
    widget.broadcast(AgoraExtensionWidgetEvent.CountdownTimerStateChanged, {
      current,
      state: remoteStatus,
      tooltip: widget.minimizedProperties.minimizedTooltip,
      icon: widget.minimizedProperties.minimizedIcon,
    });
  }, [current, remoteStatus]);
  useEffect(() => {
    if (minimized) {
      widget.setMinimize(true, { ...widget.minimizedProperties });
    }
  }, [minimized, current]);

  const handleStart = async () => {
    const seconds = timeToSeconds(timeFormat);
    if (seconds <= 0) return;
    await widget.classroomStore.api.startCountdownTimer(roomId, seconds);
  };
  const countdownTimerId = widget.roomProperties.extra?.countdownTimerId;

  const handleResume = async () => {
    await widget.classroomStore.api.resumeCountdownTimer(roomId, countdownTimerId);
  };
  const handleStop = async () => {
    await widget.classroomStore.api.stopCountdownTimer(roomId, countdownTimerId);
  };
  const handlePause = async () => {
    await widget.classroomStore.api.pauseCountdownTimer(roomId, countdownTimerId);
  };
  const progress = Math.ceil(((totalDuration - current) / totalDuration) * 100);
  return (
    <EduToolDialog
      widget={widget}
      minimizeProps={{
        disabled: false,
        tooltipContent: transI18n('fcr_countdown_timer_minimization'),
      }}
      closeProps={{
        disabled: !isStopped,
        tooltipContent: isStopped
          ? transI18n('fcr_countdown_timer_close')
          : transI18n('fcr_countdown_timer_tips_close'),
      }}
      showClose={widget.hasPrivilege}
      showMinimize={true}>
      <div className="fcr-countdown-container">
        <div className="fcr-countdown-title">{transI18n('fcr_countdown_timer_title')}</div>
        <div
          className={classnames('fcr-countdown-container-bg', {
            'fcr-countdown-container-bg-active':
              !widget.hasPrivilege || remoteStatus !== CountdownStatus.STOPPED,
          })}></div>

        <FcrCountdown
          timeFormat={timeFormat}
          progress={progress}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onChange={(time) => {
            setTimeFormat(time);
          }}
          status={remoteStatus}
          danger={current <= 10}
          widget={widget}></FcrCountdown>
      </div>
    </EduToolDialog>
  );
};

export const FcrCountdown = ({
  widget,
  timeFormat,
  status,
  onChange,
  onPause,
  onResume,
  onStart,
  onStop,
  progress,
  danger,
}: {
  timeFormat: TimeFormat;
  widget: FcrCountdownWidget;
  status: CountdownStatus;
  progress: number;
  onChange: (timeFormat: TimeFormat) => void;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  danger: boolean;
}) => {
  const transI18n = useI18n();

  const isStopped = status === CountdownStatus.STOPPED;
  const isPaused = status === CountdownStatus.PAUSED;

  const handleInputChange = (key: keyof TimeFormat, value: number) => {
    if (key === 'tensOfSeconds' && value > 6) {
      value = 0;
    }
    const newTime = {
      ...timeFormat,
      [key]:
        key === 'minutes' || key === 'tensOfMinutes' || key === 'seconds'
          ? ((value % 10) + 10) % 10
          : ((value % 6) + 6) % 6,
    };
    onChange(newTime);
  };
  return (
    <div
      className={classnames('fcr-countdown', {
        'fcr-countdown-running': !isStopped || !widget.hasPrivilege,
      })}>
      {!isStopped && (
        <div className="fcr-countdown-progress">
          <div
            className={classnames('fcr-countdown-progress-inner', {
              'fcr-countdown-progress-inner-danger': danger,
            })}
            style={{ width: `${progress}%` }}></div>
        </div>
      )}

      <div
        className={classnames('fcr-countdown-inputs', {
          'fcr-countdown-inputs-danger': !isStopped && danger,
        })}>
        <FcrCountdownInput
          readOnly={!isStopped || !widget.hasPrivilege}
          value={timeFormat.tensOfMinutes}
          onChange={(value) => {
            handleInputChange('tensOfMinutes', value);
          }}></FcrCountdownInput>
        <FcrCountdownInput
          readOnly={!isStopped || !widget.hasPrivilege}
          value={timeFormat.minutes}
          onChange={(value) => {
            handleInputChange('minutes', value);
          }}></FcrCountdownInput>
        <span>
          <SvgImg type={SvgIconEnum.FCR_COLON} size={17}></SvgImg>
        </span>
        <FcrCountdownInput
          readOnly={!isStopped || !widget.hasPrivilege}
          value={timeFormat.tensOfSeconds}
          onChange={(value) => {
            handleInputChange('tensOfSeconds', value);
          }}></FcrCountdownInput>
        <FcrCountdownInput
          readOnly={!isStopped || !widget.hasPrivilege}
          value={timeFormat.seconds}
          onChange={(value) => {
            handleInputChange('seconds', value);
          }}></FcrCountdownInput>
      </div>
      {!isStopped && widget.hasPrivilege && (
        <div className="fcr-countdown-inputs-mask">
          <ToolTip placement="bottom" content={transI18n('fcr_countdown_timer_tips_reset')}>
            <div className="fcr-countdown-actions-stop" onClick={onStop}>
              <SvgImg type={SvgIconEnum.FCR_RECORDING_END} size={28}></SvgImg>
            </div>
          </ToolTip>
          <ToolTip
            placement="bottom"
            content={
              isPaused
                ? transI18n('fcr_countdown_timer_tips_start')
                : transI18n('fcr_countdown_timer_tips_pause')
            }>
            <div className="fcr-countdown-actions-start" onClick={isPaused ? onResume : onPause}>
              <SvgImg
                type={isPaused ? SvgIconEnum.FCR_RECORDING_PLAY : SvgIconEnum.FCR_STOP}
                size={28}></SvgImg>
            </div>
          </ToolTip>
        </div>
      )}
      <div className="fcr-countdown-actions">
        <ToolTip
          placement="bottom"
          content={
            timeToSeconds(timeFormat) <= 0
              ? transI18n('fcr_countdown_timer_tips_duration')
              : transI18n('fcr_countdown_timer_tips_start')
          }>
          <div
            className={classnames('fcr-countdown-actions-start', {
              'fcr-countdown-actions-start-disable': timeToSeconds(timeFormat) <= 0,
            })}
            onClick={onStart}>
            <SvgImg type={SvgIconEnum.FCR_RECORDING_PLAY} size={28}></SvgImg>
          </div>
        </ToolTip>
      </div>
    </div>
  );
};
type FcrCountdownInputProps = {
  readOnly: boolean;
  value: number;
  onChange: (value: number) => void;
};
const FcrCountdownInput: FC<FcrCountdownInputProps> = (props) => {
  const { value, onChange, readOnly } = props;
  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const input = e.target.value;
    const oldVal = value.toString();
    const num =
      input.length === 1
        ? Number(input)
        : Number(input.includes(oldVal) ? input.replace(oldVal, '') : value);
    if (isNaN(num)) return;
    onChange(num);
  };
  return (
    <div className="fcr-countdown-input-wrapper">
      <div
        className={classnames('fcr-countdown-input-add', {
          'fcr-countdown-input-add-readonly': readOnly,
        })}
        onClick={() => {
          onChange(value + 1);
        }}>
        <SvgImg type={SvgIconEnum.FCR_COUNTDOWN_UP} size={32}></SvgImg>
      </div>
      <div className="fcr-countdown-input">
        <input value={value} readOnly={readOnly} onChange={handleChange}></input>
      </div>
      <div
        className={classnames('fcr-countdown-input-minus', {
          'fcr-countdown-input-minus-readonly': readOnly,
        })}
        onClick={() => {
          onChange(value - 1);
        }}>
        <SvgImg type={SvgIconEnum.FCR_COUNTDOWN_DOWN} size={32}></SvgImg>
      </div>
    </div>
  );
};
