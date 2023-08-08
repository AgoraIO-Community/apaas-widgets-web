import { ChangeEventHandler, FC, useEffect, useState } from 'react';
import { FcrCountdownWidget } from '.';
import isNan from 'lodash/isNaN';
import classnames from 'classnames';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import './app.css';
import { ToolTip } from '@components/tooltip';
import {
  CountdownStatus,
  useCountdown,
  useCountdownMinimized,
  useCountdownRemoteStatus,
} from './hooks';
import dayjs from 'dayjs';
import { useI18n } from 'agora-common-libs';
import { EduToolDialog } from '../common/dialog';
type TimeFormat = {
  tensOfMinutes: number;
  minutes: number;
  tensOfSeconds: number;
  seconds: number;
};

export const FcrCountdownApp = ({ widget }: { widget: FcrCountdownWidget }) => {
  const transI18n = useI18n();
  const { minimized } = useCountdownMinimized(widget);
  const {
    duration,
    setDuration,
    totalDuration,
    setTotalDuration,
    status: remoteStatus,
  } = useCountdownRemoteStatus(widget);
  const [seconds, setSeconds] = useState(0);
  const { current, start, stop, pause, status } = useCountdown(duration, remoteStatus);
  const isStopped = status === CountdownStatus.STOPPED;

  useEffect(() => {
    if (minimized) {
      widget.setMinimize(true, { current });
    }
  }, [minimized, current]);

  useEffect(() => {
    if (isStopped && widget.hasPrivilege) {
      handleStop();
    }
  }, [isStopped]);

  const handleStart = () => {
    if (seconds <= 0) return;
    widget.setActive({
      extra: {
        state: 1,
        startTime: Date.now() + widget.classroomStore.roomStore.clientServerTimeShift,
        duration: seconds,
        totalDuration: seconds,
      },
    });
    setDuration(seconds);
    start();
    setTotalDuration(seconds);
  };
  const handleResume = () => {
    widget.updateWidgetProperties({
      extra: {
        state: 1,
        startTime: Date.now() + widget.classroomStore.roomStore.clientServerTimeShift,
        duration: current,
      },
    });
    start();
  };
  const handleStop = () => {
    widget.updateWidgetProperties({
      extra: { state: 0, startTime: 0, duration: 0, totalDuration: 0 },
    });
    setDuration(0);
    setTotalDuration(0);
    setSeconds(0);
    stop();
  };
  const handlePause = () => {
    pause();

    widget.updateWidgetProperties({
      extra: {
        state: 2,
        startTime: 0,
        duration: current,
      },
    });
  };

  return (
    <EduToolDialog
      showClose={widget.hasPrivilege}
      showMinus
      minusProps={{
        tooltipContent: transI18n('fcr_countdown_timer_minimization'),
      }}
      onMinusClick={() => widget.setMinimize(true, { current })}
      closeProps={{
        disabled: status !== CountdownStatus.STOPPED,
        tooltipContent:
          status !== CountdownStatus.STOPPED
            ? transI18n('fcr_countdown_timer_tips_close')
            : transI18n('fcr_countdown_timer_close'),
      }}
      onCloseClick={widget.handleClose}>
      <div className="fcr-countdown-container">
        <div className="fcr-countdown-title">{transI18n('fcr_countdown_timer_title')}</div>
        <div
          className={classnames('fcr-countdown-container-bg', {
            'fcr-countdown-container-bg-active':
              !widget.hasPrivilege || status !== CountdownStatus.STOPPED,
          })}></div>

        <FcrCountdown
          current={status === CountdownStatus.STOPPED ? seconds : current}
          total={totalDuration}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onChange={setSeconds}
          status={status}
          widget={widget}></FcrCountdown>
      </div>
    </EduToolDialog>
  );
};

export const FcrCountdown = ({
  widget,
  current,
  status,
  total,
  onChange,
  onPause,
  onResume,
  onStart,
  onStop,
}: {
  widget: FcrCountdownWidget;
  current: number;
  status: CountdownStatus;
  total: number;
  onChange: (value: number) => void;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}) => {
  const transI18n = useI18n();

  const [timeFormat, setTimeFormat] = useState<TimeFormat>({
    tensOfMinutes: 0,
    minutes: 0,
    tensOfSeconds: 0,
    seconds: 0,
  });
  useEffect(() => {
    const time = dayjs.duration(current * 1000);
    const minutes = time.minutes() || 0;
    const seconds = time.seconds() || 0;
    setTimeFormat({
      tensOfMinutes: Math.floor(minutes / 10),
      minutes: minutes % 10,
      tensOfSeconds: Math.floor(seconds / 10),
      seconds: seconds % 10,
    });
  }, [current]);
  const isStopped = status === CountdownStatus.STOPPED;
  const isPaused = status === CountdownStatus.PAUSED;
  const progress = Math.ceil(((total - current) / total) * 100);

  const handleInputChange = (key: keyof TimeFormat, value: number) => {
    setTimeFormat((prev) => {
      const newState = {
        ...prev,
        [key]: value < 0 ? 9 : value > 9 ? 0 : value,
      };
      onChange(
        dayjs
          .duration({
            minutes: newState.tensOfMinutes * 10 + newState.minutes,
            seconds: newState.tensOfSeconds * 10 + newState.seconds,
          })
          .asSeconds(),
      );
      return newState;
    });
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
              'fcr-countdown-progress-inner-danger': current <= 10,
            })}
            style={{ width: `${progress}%` }}></div>
        </div>
      )}

      <div
        className={classnames('fcr-countdown-inputs', {
          'fcr-countdown-inputs-danger': !isStopped && current <= 10,
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
        <ToolTip placement="bottom" content={transI18n('fcr_countdown_timer_tips_start')}>
          <div className="fcr-countdown-actions-start" onClick={onStart}>
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
    const value = Number(e.target.value);
    if (isNan(value)) return;
    onChange(value);
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
        <input value={value} readOnly={readOnly} maxLength={1} onChange={handleChange}></input>
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
