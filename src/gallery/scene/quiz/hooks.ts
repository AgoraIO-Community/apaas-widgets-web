import { useEffect, useRef, useState } from 'react';
import { autorun } from 'mobx';
import { FcrPopupQuizWidget } from '.';
import throttle from 'lodash/throttle';
import { Scheduler } from 'agora-common-libs';
export enum QuizStatus {
  INITIALIZED = 2,
  STARTED = 1,
  ENDED = 0,
}
export const maxQuizCount = 8;
export const minQuizCount = 2;
export const useQuizSelect = (
  initialOptions = ['A', 'B', 'C', 'D'],
  initialSelectedOptions: string[] = [],
) => {
  const [options, setOptions] = useState(initialOptions);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(initialSelectedOptions);

  const addOption = () => {
    if (options.length < maxQuizCount) {
      const lastOption = options[options.length - 1];
      const newOption = String.fromCharCode(lastOption.charCodeAt(0) + 1);
      setOptions([...options, newOption]);
    }
  };

  const removeOption = () => {
    if (options.length > minQuizCount) {
      setOptions(options.slice(0, -1));
      setSelectedOptions(selectedOptions.filter((option) => option !== options.slice(-1)[0]));
    }
  };

  const selectOption = (option: string) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((selectedOption) => selectedOption !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const deselectOption = (option: string) => {
    setSelectedOptions(selectedOptions.filter((selectedOption) => selectedOption !== option));
  };

  const resetOptions = () => {
    setSelectedOptions([]);
    setOptions(initialOptions);
  };

  return {
    options,
    selectedOptions: selectedOptions.slice().sort(),
    addOption,
    removeOption,
    selectOption,
    deselectOption,
    resetOptions,
  };
};
export const useQuizStatus = (widget: FcrPopupQuizWidget) => {
  const [status, setStatus] = useState<QuizStatus>(
    widget.roomProperties.extra?.answerState ?? QuizStatus.INITIALIZED,
  );
  useEffect(() => {
    return autorun(() => {
      const { extra } = widget.roomProperties;
      const status = (extra?.answerState as QuizStatus) ?? QuizStatus.INITIALIZED;
      setStatus(status);
    });
  }, []);
  return {
    status,
    setStatus,
  };
};
export type QuizAnswerListItem = {
  isCorrect: boolean;
  lastCommitTime: number;
  ownerUserName: string;
  ownerUserUuid: string;
  popupQuizId: string;
  selectedItems: string[];
};
export const useAnswerList = (widget: FcrPopupQuizWidget, status: QuizStatus) => {
  const [answerList, setAnswerList] = useState<QuizAnswerListItem[]>([]);
  const taskRef = useRef<Scheduler.Task | null>(null);
  const updateAnswerList = async () => {
    const list = await fetchAnswerList(widget);
    setAnswerList(list as QuizAnswerListItem[]);
  };
  useEffect(() => {
    if (widget.hasPrivilege) {
      if (status === QuizStatus.INITIALIZED) {
        setAnswerList([]);
      }
      if (status === QuizStatus.STARTED) {
        updateAnswerList();
        taskRef.current = Scheduler.shared.addIntervalTask(async () => {
          await updateAnswerList();
        }, Scheduler.Duration.second(3));
      }
      if (status === QuizStatus.ENDED) {
        taskRef.current?.stop();
        updateAnswerList();
      }
    }
    return () => {
      taskRef.current?.stop();
    };
  }, [status]);
  return {
    answerList,
  };
};
export const fetchAnswerList = throttle(async (widget: FcrPopupQuizWidget) => {
  const { extra } = widget.roomProperties;

  const roomId = widget.classroomStore.connectionStore.sceneId;
  const {
    data: { list },
  } = await widget.classroomStore.api.getAnswerList(roomId, extra?.popupQuizId, {
    nextId: 0,
    count: 1000,
  });
  return list as QuizAnswerListItem[];
}, 1000);
export const useQuizDuration = (widget: FcrPopupQuizWidget) => {
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    let task: Scheduler.Task | null = null;
    const disposer = autorun(() => {
      const timestampGap = widget.classroomStore.roomStore.clientServerTimeShift;
      const startTime = widget.roomProperties.extra?.receiveQuestionTime || 0;
      const status = widget.roomProperties.extra?.answerState || QuizStatus.INITIALIZED;
      task?.stop();
      if (status === QuizStatus.STARTED) {
        task = Scheduler.shared.addIntervalTask(() => {
          setDuration(Date.now() + timestampGap - startTime);
        }, Scheduler.Duration.second(1));
      }
    });
    return () => {
      disposer();
      task?.stop();
    };
  }, []);
  return { duration };
};
