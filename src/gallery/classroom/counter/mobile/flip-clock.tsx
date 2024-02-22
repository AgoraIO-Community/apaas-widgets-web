import React from 'react';
import dayjs from 'dayjs';
import FlipCard from './flip-card';

export const formatDiff = (duration: number) => {
  const time = dayjs.duration(duration, 'seconds');
  const minutes = time.asMinutes() || 0;
  const seconds = time.seconds() || 0;
  const formatedStr = `${Math.floor(minutes / 10)}${Math.floor(minutes % 10)}:${Math.floor(
    seconds / 10,
  )}${Math.floor(seconds % 10)}`;
  const [m, s] = formatedStr.split(':');
  const [m1, m2, s1, s2] = [+`${m}`[0], +`${m}`[1], +`${s}`[0], +`${s}`[1]];
  return [m1, m2, s1, s2];
};

const FlipClock = ({ duration, caution }: { duration: number; caution: boolean }) => {
  const [clock, setClock] = React.useState<number[]>([0, 0, 0, 0]);

  React.useEffect(() => {
    const formatClock = formatDiff(duration);
    setClock(formatClock);
  }, [duration]);

  return (
    <div className="fcr-flex fcr-justify-center">
      <div className="fcr-flex flip-card-mobile-wrap">
        <FlipCard number={clock[0]} caution={caution} />
        <FlipCard number={clock[1]} caution={caution} />
      </div>

      <div className="flip-card-mobile-time-unit">:</div>
      <div className="fcr-flex flip-card-mobile-wrap">
        <FlipCard number={clock[2]} caution={caution} />
        <FlipCard number={clock[3]} caution={caution} />
      </div>
    </div>
  );
};

export default FlipClock;
