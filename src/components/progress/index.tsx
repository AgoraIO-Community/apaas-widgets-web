import { useI18n } from 'agora-common-libs';
import classnames from 'classnames';
import React, {
  createRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import './index.css';

export type ProgressType = 'download';

export interface ProgressProps {
  progress: number;
  width: number;
  type: ProgressType;
  className?: string;
  style?: React.CSSProperties;
}

export const Progress: React.FC<ProgressProps> = ({
  progress,
  width,
  className,
  style,
  type,
  ...restProps
}) => {
  const cls = classnames({
    [`${className}`]: !!className,
  });

  const bgCls = classnames('fcr-progress', {
    [`fcr-overflow-hidden fcr-h-2 fcr-text-xs fcr-flex fcr-rounded bg-${type}-bg`]: 1,
    ['progress-height']: 1,
  });

  const fgCls = classnames('fcr-progress-inner', {
    [`bg-${type}-fg`]: 1,
  });

  const progressWidth = progress;

  return (
    <div
      className={cls}
      style={{
        width: width,
        ...style,
      }}
      {...restProps}>
      <div className={bgCls}>
        <div className={fgCls} style={{ width: `${progressWidth}%` }}></div>
      </div>
    </div>
  );
};

type ProgressListItem = Pick<ProgressProps, 'width' | 'progress'> & {
  key: string;
  auto?: boolean;
};

interface ProgressListRef {
  show: (dialog: ProgressListItem) => void;
  destroy: (key: React.Key) => void;
  destroyAll: () => void;
}

const ProgressList = forwardRef<ProgressListRef>((_, ref) => {
  const [progressList, setProgressList] = useState<ProgressListItem[]>([]);
  const transI18n = useI18n();

  useImperativeHandle(ref, () => ({
    show: (dialog: ProgressListItem) => {
      setProgressList((list: ProgressListItem[]) => {
        const target = list.find((item) => item.key === dialog.key);

        if (!target) {
          return [...list, dialog];
        }
        return list.map((item) => {
          if (item.key === dialog.key) {
            return { ...item, ...dialog };
          }
          return item;
        });
      });
    },
    destroy: (key: React.Key) => {
      setProgressList(() => progressList.filter((item) => item.key !== key));
    },
    destroyAll: () => {
      setProgressList([]);
    },
  }));

  return (
    <div className="dialog-progress-container">
      {progressList.map((progress) => (
        <div className={`dialog-progress-item fcr-progress-${progress.key}`} key={progress.key}>
          <span className="dialog-progress-tip">{transI18n('fcr_savecanvas_tips_saving')}</span>
          <div className="fcr-flex fcr-items-center fcr-gap-2">
            <ProgressWarpper
              key={progress.key}
              width={progress.width}
              progress={progress.progress}
              auto={progress.auto}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

ProgressList.displayName = 'dialog-progress';

const ProgressWarpper = ({ key, width, progress, auto }: ProgressListItem) => {
  const [state, setState] = useState({ key, width, progress });
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    progress !== width && setState((state) => ({ ...state, progress }));
  }, [progress]);

  useEffect(() => {
    if (auto) {
      timerRef.current = setInterval(() => {
        setState((preState) => {
          const randomValue = Math.floor(Math.random() * 10 + 10);
          let currentProgress = preState.progress + randomValue;
          currentProgress = currentProgress > preState.width ? preState.width - 1 : currentProgress;
          return { ...preState, progress: currentProgress };
        });
      }, 600);
      return () => {
        timerRef.current && clearInterval(timerRef.current);
      };
    }
  }, []);

  useEffect(() => {
    if (state.progress >= state.width) {
      timerRef.current && clearInterval(timerRef.current);
    }
  }, [state]);

  return (
    <>
      <Progress key={state.key} width={state.width} progress={state.progress} type="download" />
      <span className="progress-percentage">{`${Math.floor(
        (state.progress / state.width) * 100,
      )}%`}</span>
    </>
  );
};

let progressListInstance = createRef<ProgressListRef>();

const createProgressListInstance = () => {
  if (progressListInstance.current) {
    return progressListInstance;
  }
  const progressListRef = createRef<ProgressListRef>();
  const div = document.createElement('div');
  document.body.appendChild(div);
  ReactDOM.render(<ProgressList ref={progressListRef} />, div);
  progressListInstance = progressListRef;
  return progressListInstance;
};

export const DialogProgressApi = {
  show: (dialog: ProgressListItem) => {
    const closePromise: Promise<typeof progressListInstance> = new Promise((resolve) => {
      const instance = createProgressListInstance();
      resolve(instance);
    });

    closePromise.then((instance) => {
      instance.current?.show(dialog);
    });
  },
  destroy: (key: React.Key) => {
    progressListInstance.current?.destroy(key);
  },
};
