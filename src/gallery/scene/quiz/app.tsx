import { FcrPopupQuizWidget } from '.';
import classnames from 'classnames';
import { useI18n } from 'agora-common-libs';
import './app.css';
import { Button } from '@components/button';
import {
  QuizStatus,
  fetchAnswerList,
  maxQuizCount,
  minQuizCount,
  useAnswerList,
  useQuizDuration,
  useQuizSelect,
  useQuizStatus,
} from './hooks';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { Popover } from '@components/popover';
import { Table } from '@components/table';
import { Bar } from '@antv/g2plot';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Progress } from '@components/progress';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import throttle from 'lodash/throttle';
import { EduToolDialog } from '../common/dialog/base';
import { observer } from 'mobx-react';
export const FcrPopupQuizApp = observer(({ widget }: { widget: FcrPopupQuizWidget }) => {
  const transI18n = useI18n();
  const { status } = useQuizStatus(widget);

  return (
    <EduToolDialog
      widget={widget}
      showClose={widget.hasPrivilege}
      showMinimize
      closeProps={{
        disabled: status === QuizStatus.STARTED,
        tooltipContent:
          status === QuizStatus.STARTED
            ? transI18n('fcr_popup_quiz_widget_close')
            : transI18n('fcr_popup_quiz_close'),
      }}
      minimizeProps={{
        disabled: false,
        tooltipContent: transI18n('fcr_popup_quiz_minimization'),
      }}>
      {widget.hasPrivilege ? (
        <TeacherQuiz widget={widget}></TeacherQuiz>
      ) : (
        <StudentQuiz widget={widget}></StudentQuiz>
      )}
    </EduToolDialog>
  );
});
const StudentQuiz = observer(({ widget }: { widget: FcrPopupQuizWidget }) => {
  const transI18n = useI18n();
  const colors = themeVal('colors');

  const isSubmit = widget.userProperties.popupQuizId === widget.roomProperties.extra?.popupQuizId;

  const { options, selectOption, selectedOptions, deselectOption } = useQuizSelect(
    widget.roomProperties.extra?.items || [],
    (isSubmit && widget.userProperties.selectedItems) || [],
  );
  const { status } = useQuizStatus(widget);
  const [editing, setEditing] = useState<boolean>(
    status === QuizStatus.STARTED && selectedOptions.length <= 0,
  );

  const { duration } = useQuizDuration(widget);
  const handleClick = async () => {
    if (editing) {
      const { userUuid } = widget.classroomConfig.sessionInfo;
      const { extra } = widget.roomProperties;
      const popupQuizId = extra.popupQuizId;
      const roomId = widget.classroomStore.connectionStore.sceneId;
      await widget.classroomStore.api.submitAnswer(roomId, popupQuizId, userUuid, {
        selectedItems: selectedOptions,
      });
      setEditing(false);
    } else {
      setEditing(true);
    }
  };
  const { selectedCount = 0, totalCount, averageAccuracy = 0 } = widget.roomProperties.extra || {};
  const inProgress = status === QuizStatus.STARTED && !widget.isAudience;
  return (
    <div
      className={classnames('fcr-popup-quiz', 'fcr-popup-quiz-student', {
        'fcr-popup-quiz-in-progress': status !== QuizStatus.INITIALIZED,
      })}
      style={{
        height: inProgress ? (options.length > 4 ? 214 : 172) : 180,
      }}>
      <div
        style={{ height: inProgress ? (options.length > 4 ? 149 : 101) : 100 }}
        className={classnames('fcr-popup-quiz-container-bg')}>
        <div className="fcr-popup-quiz-title">
          {transI18n('fcr_popup_quiz')}
          {status === QuizStatus.STARTED && (
            <span>{dayjs.duration(duration).format('HH:mm:ss')}</span>
          )}
        </div>
        {inProgress && (
          <div
            className="fcr-popup-quiz-student-select"
            style={{ pointerEvents: editing ? 'all' : 'none' }}>
            {options.map((item) => {
              const selected = selectedOptions.includes(item);
              return (
                <div
                  key={item}
                  onClick={() => {
                    if (!editing) return;
                    selected ? deselectOption(item) : selectOption(item);
                  }}
                  className={classnames('fcr-popup-quiz-initialized-select-item', {
                    'fcr-popup-quiz-initialized-select-item-active': selected,
                  })}>
                  {selected && (
                    <div className="fcr-popup-quiz-initialized-select-item-select-icon">
                      <SvgImg type={SvgIconEnum.FCR_CHECKBOX_CHECK} size={12}></SvgImg>
                    </div>
                  )}
                  {item}
                </div>
              );
            })}
          </div>
        )}
        {!inProgress && (
          <div className="fcr-popup-quiz-student-answer">
            <div>
              <div className="fcr-popup-quiz-student-answer-label">
                {transI18n('fcr_popup_quiz_correct')}:
              </div>
              <div className="fcr-popup-quiz-student-answer-value">
                {widget.roomProperties.extra?.correctItems?.join(' ')}
              </div>
            </div>
            <div>
              <div className="fcr-popup-quiz-student-answer-label">
                {transI18n('fcr_popup_quiz_my_answer')}:
              </div>
              <div
                className={classnames(
                  'fcr-popup-quiz-student-answer-value',
                  `fcr-popup-quiz-answer-${
                    isSubmit
                      ? widget.userProperties.isCorrect
                        ? 'correct'
                        : 'incorrect'
                      : 'unsubmit'
                  }`,
                )}>
                {isSubmit ? widget.userProperties.selectedItems?.join(' ') : '- -'}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="fcr-popup-quiz-in-progress-student-container">
        {inProgress && (
          <div className="fcr-popup-quiz-in-progress-student-btns">
            {editing ? (
              <>
                {isSubmit && (
                  <Button size="XS" styleType="gray" onClick={() => setEditing(false)}>
                    {transI18n('fcr_popup_quiz_change_cancel')}
                  </Button>
                )}
                <Button
                  block
                  size="XS"
                  disabled={selectedOptions.length <= 0}
                  onClick={handleClick}>
                  {transI18n('fcr_popup_quiz_post')}
                </Button>
              </>
            ) : (
              <Button block size="XS" type={'secondary'} onClick={handleClick}>
                {transI18n('fcr_popup_quiz_change')}
              </Button>
            )}
          </div>
        )}
        {!inProgress && (
          <>
            <div className="fcr-popup-quiz-student-answer-overview">
              <div className="fcr-popup-quiz-student-answer-label">
                {transI18n('fcr_popup_quiz_accuracy')}:
              </div>
              <div className="fcr-popup-quiz-student-answer-value">
                {Math.floor(averageAccuracy * 100)}
                <span className="fcr-text-2">%</span>
              </div>
            </div>
            <Progress
              backgroundColor={colors['block-3']}
              strokeWidth={18}
              percentText={`${selectedCount} / ${totalCount}`}
              percent={(selectedCount / totalCount) * 100}></Progress>
          </>
        )}
      </div>
    </div>
  );
});
const TeacherQuiz = observer(({ widget }: { widget: FcrPopupQuizWidget }) => {
  const transI18n = useI18n();
  const colors = themeVal('colors');

  const {
    options,
    addOption,
    removeOption,
    selectOption,
    selectedOptions,
    deselectOption,
    resetOptions,
  } = useQuizSelect();
  const { status, setStatus } = useQuizStatus(widget);
  const { duration } = useQuizDuration(widget);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Bar | null>(null);
  const { answerList } = useAnswerList(widget, status);
  const getOptionPercentage = (option: string) => {
    const total = answerList.length;
    const count = answerList.filter((item) => item.selectedItems.includes(option)).length;
    return total > 0 ? (count / total) * 100 : 0;
  };

  const getOptionList = () => {
    const options = answerList.reduce((acc, item) => {
      item.selectedItems.forEach((option) => {
        if (!acc.includes(option)) {
          acc.push(option);
        }
      });
      return acc;
    }, [] as string[]);

    const optionList = options.map((option) => ({
      name: option,
      value: getOptionPercentage(option),
    }));

    return optionList;
  };
  useEffect(() => {
    if (status !== QuizStatus.INITIALIZED) {
      const data = getOptionList();

      if (chartContainerRef.current && !chartRef.current) {
        chartRef.current = new Bar(chartContainerRef.current, {
          interactions: [{ type: 'active-region', enable: false }],
          tooltip: {
            showMarkers: false,
            customContent: (title, data) => {
              const value = data[0]?.value || 0;
              return `<div>${Number(value).toFixed(1)}%</div>`;
            },
          },
          barStyle: {
            radius: [25, 25, 0, 0],
            fill: 'l(0) 0:#0056FD  1:#E5EEFF',
          },
          label: {
            position: 'left',
            style: {
              fill: 'white',
            },

            formatter: (data) => {
              return data.name;
            },
          },
          maxBarWidth: 25,
          minBarWidth: 25,
          width: 160,
          height: 340,
          xField: 'value',
          yField: 'name',
          yAxis: {
            top: true,
            label: null,
          },
          data: data,
          xAxis: {
            line: {
              style: {
                stroke: 'l(0) 0:#E5EEFF  1:#0056FD',
                lineWidth: 1,
              },
            },
            grid: {
              line: {
                style: {
                  stroke: '#4A4C5F',
                  lineWidth: 1,
                  lineDash: [4, 5],
                  strokeOpacity: 0.7,
                },
              },
            },
            label: {
              formatter: (v) => {
                return `${v}%`;
              },
            },
          },
        });
        chartRef.current.render();
      } else {
        chartRef.current?.changeData(data);
      }
    } else {
      chartRef.current?.destroy();
      chartRef.current = null;
    }
  }, [status, answerList]);
  useEffect(() => {
    if (status === QuizStatus.INITIALIZED) {
      widget.updateSize(
        widget.hasPrivilege ? widget.teacherInitializeSize : widget.studentInitializeSize,
      );
    } else {
      widget.updateSize(
        widget.hasPrivilege ? widget.teacherInProgressSize : widget.studentInitializeSize,
      );
    }
  }, [status]);
  const handleStart = async () => {
    const body = {
      correctItems: selectedOptions,
      items: options,
    };
    const roomId = widget.classroomStore.connectionStore.sceneId;
    await widget.classroomStore.api.startAnswer(roomId, body);
    setStatus(QuizStatus.STARTED);
  };
  const handleStop = async () => {
    const { extra } = widget.roomProperties;
    const roomId = widget.classroomStore.connectionStore.sceneId;
    await widget.classroomStore.api.stopAnswer(roomId, extra.popupQuizId);
    setStatus(QuizStatus.ENDED);
  };
  const handleRestart = async () => {
    // widget.handleRestart();
    setStatus(QuizStatus.INITIALIZED);
    resetOptions();
    widget.updateWidgetProperties({ extra: { answerState: QuizStatus.INITIALIZED } });
  };
  const { extra } = widget.roomProperties;
  const selectedCount = extra?.selectedCount || 0;
  const totalCount = extra?.totalCount || 0;
  return (
    <div
      className={classnames('fcr-popup-quiz', {
        'fcr-popup-quiz-in-progress': status !== QuizStatus.INITIALIZED,
      })}>
      <div className={classnames('fcr-popup-quiz-container-bg')}>
        <div className="fcr-popup-quiz-title">
          {transI18n('fcr_popup_quiz')}
          {status === QuizStatus.STARTED && (
            <span>{dayjs.duration(duration).format('HH:mm:ss')}</span>
          )}
        </div>
        {status !== QuizStatus.INITIALIZED && (
          <div className="fcr-popup-quiz-data">
            <div className="fcr-popup-quiz-progress">
              <Progress
                showPercentText={false}
                backgroundColor={colors['block-2']}
                strokeWidth={8}
                percent={(selectedCount / totalCount) * 100}></Progress>
            </div>
            <div className="fcr-popup-quiz-data-detail">
              <div>
                <div className="fcr-popup-quiz-data-detail-label">
                  {transI18n('fcr_popup_quiz_accuracy')}:
                </div>
                <div className="fcr-popup-quiz-data-detail-value">
                  {`${Math.floor((extra?.averageAccuracy || 0) * 100)}`}{' '}
                  <span className="fcr-text-2">%</span>
                </div>
              </div>
              <div>
                <div className="fcr-popup-quiz-data-detail-label">
                  {transI18n('fcr_popup_quiz_submission')}:
                </div>
                <div className="fcr-popup-quiz-data-detail-value">
                  {`${extra?.selectedCount || 0}`}{' '}
                  <span className="fcr-text-2">{`/ ${extra?.totalCount || 0}`}</span>
                </div>
              </div>
            </div>
            <div className="fcr-popup-quiz-data-detail">
              <div>
                <div className="fcr-popup-quiz-data-detail-label">
                  {transI18n('fcr_popup_quiz_correct')}:
                </div>
                <div className="fcr-popup-quiz-data-detail-value">
                  {extra?.correctItems?.join(' ')}
                </div>
              </div>
            </div>
          </div>
        )}
        {status === QuizStatus.INITIALIZED && (
          <div className="fcr-popup-quiz-desc">{transI18n('fcr_popup_quiz_description')}</div>
        )}
      </div>

      {status === QuizStatus.INITIALIZED && (
        <div className="fcr-popup-quiz-initialized-container">
          <div className="fcr-popup-quiz-initialized">
            <div className="fcr-popup-quiz-initialized-select">
              {options.map((item) => {
                const selected = selectedOptions.includes(item);
                return (
                  <div
                    key={item}
                    onClick={() => (selected ? deselectOption(item) : selectOption(item))}
                    className={classnames('fcr-popup-quiz-initialized-select-item', {
                      'fcr-popup-quiz-initialized-select-item-active': selected,
                    })}>
                    {selected && (
                      <div className="fcr-popup-quiz-initialized-select-item-select-icon">
                        <SvgImg type={SvgIconEnum.FCR_CHECKBOX_CHECK} size={12}></SvgImg>
                      </div>
                    )}
                    {item}
                  </div>
                );
              })}
            </div>
            <div className="fcr-popup-quiz-initialized-actions">
              <div
                className={classnames('fcr-popup-quiz-initialized-add', {
                  'fcr-popup-quiz-initialized-action-disabled': options.length >= maxQuizCount,
                })}
                onClick={addOption}>
                +
              </div>
              <div
                className={classnames('fcr-popup-quiz-initialized-minus', {
                  'fcr-popup-quiz-initialized-action-disabled': options.length <= minQuizCount,
                })}
                onClick={removeOption}>
                -
              </div>
            </div>
          </div>

          <Button onClick={handleStart} disabled={selectedOptions.length <= 0} size="S" block>
            {transI18n('fcr_popup_quiz_start_answer')}
          </Button>
        </div>
      )}
      {status !== QuizStatus.INITIALIZED && (
        <div className="fcr-popup-quiz-in-progress-container">
          <div className="fcr-popup-quiz-in-progress-detail">
            <div className="fcr-popup-quiz-in-progress-chart">
              <div ref={chartContainerRef}></div>
            </div>
            <div className="fcr-popup-quiz-in-progress-participants">
              <Table
                scroll={{ y: 314 }}
                data={answerList}
                rowKey={(data) => data.ownerUserUuid}
                columns={[
                  {
                    title: (
                      <div className="fcr-popup-quiz-table-cell-name">
                        {transI18n('fcr_popup_quiz_student_name')}
                      </div>
                    ),
                    dataIndex: 'ownerUserName',
                    width: 110,
                    align: 'left',

                    render: (name: string) => {
                      return (
                        <div className="fcr-popup-quiz-table-cell-name fcr-table-cell-ellipsis">
                          {name}
                        </div>
                      );
                    },
                  },
                  {
                    title: transI18n('fcr_popup_quiz_answer_time'),
                    dataIndex: 'lastCommitTime',
                    width: 65,
                    render: (time: number) => {
                      return dayjs
                        .duration(time - widget.roomProperties.extra.receiveQuestionTime)
                        .format('mm:ss');
                    },
                  },
                  {
                    title: (
                      <div className="fcr-popup-quiz-table-cell-answer">
                        {transI18n('fcr_popup_quiz_student_answer')}
                      </div>
                    ),
                    dataIndex: 'selectedItems',
                    align: 'center',
                    width: 80,
                    render: (answer: string[], record) => {
                      return (
                        <div
                          className={`fcr-popup-quiz-answer-${
                            record.isCorrect ? 'correct' : 'incorrect'
                          }`}>
                          {answer.join(' ')}
                        </div>
                      );
                    },
                  },
                ]}></Table>
            </div>
          </div>
          <div className="fcr-popup-quiz-in-progress-actions">
            <div className="fcr-popup-quiz-in-progress-action-reward">
              <QuizRewardPopover widget={widget}></QuizRewardPopover>
            </div>

            <div>
              {status === QuizStatus.STARTED ? (
                <>
                  <ReviseQuizSelectPopover widget={widget}></ReviseQuizSelectPopover>
                  <Button size="XS" onClick={handleStop} styleType="danger">
                    {transI18n('fcr_popup_quiz_end_answer')}
                  </Button>
                </>
              ) : (
                <Button size="XS" onClick={handleRestart}>
                  {transI18n('fcr_popup_quiz_start_again')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const QuizRewardPopover = ({ widget }: { widget: FcrPopupQuizWidget }) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  return (
    <Popover
      visible={popoverVisible}
      trigger="click"
      showArrow={false}
      overlayOffset={8}
      placement="topLeft"
      content={
        <QuizReward
          widget={widget}
          onRewardSuccess={() => {
            setPopoverVisible(false);
          }}></QuizReward>
      }
      overlayInnerStyle={{ width: 175, height: 130 }}
      onVisibleChange={setPopoverVisible}>
      <Button size="XS" styleType="gray">
        <SvgImg type={SvgIconEnum.FCR_REWARDALL} />
        <SvgImg
          type={SvgIconEnum.FCR_DROPDOWN}
          style={{
            transform: `rotate(${popoverVisible ? '0deg' : '180deg'})`,
            transition: '.2s all',
          }}
        />
      </Button>
    </Popover>
  );
};
export const QuizReward = ({
  widget,
  onRewardSuccess,
}: {
  widget: FcrPopupQuizWidget;
  onRewardSuccess: () => void;
}) => {
  const transI18n = useI18n();
  const sendAward = throttle(async (type: 'correct' | 'all') => {
    const list = await fetchAnswerList(widget);

    let args: { userUuid: string; changeReward: number }[] = [];
    if (type === 'correct') {
      args = list
        .filter(({ isCorrect }) => isCorrect)
        .map(({ ownerUserUuid }) => {
          return { userUuid: ownerUserUuid, changeReward: 1 };
        });
      if (args.length > 0) {
        await widget.classroomStore.roomStore.sendRewards(args, true);
        onRewardSuccess();
      } else {
        widget.ui.addToast(transI18n('fcr_popup_quiz_reward_correct_nobody'), 'warning');
      }
    } else {
      args = list.map(({ ownerUserUuid }) => {
        return { userUuid: ownerUserUuid, changeReward: 1 };
      });
      if (args.length > 0) {
        await widget.classroomStore.roomStore.sendRewards(args, true);
        onRewardSuccess();
      } else {
        widget.ui.addToast(transI18n('fcr_popup_quiz_reward_all_nobody'), 'warning');
      }
    }
  }, 1000);
  return (
    <div className="fcr-poppu-quiz-reward">
      <div className="fcr-poppu-quiz-reward-title">{transI18n('fcr_popup_quiz_reward')}</div>
      <div className="fcr-poppu-quiz-reward-actions">
        <div className="fcr-poppu-quiz-reward-action-item" onClick={() => sendAward('correct')}>
          <SvgImg type={SvgIconEnum.FCR_REWARDALL} size={20}></SvgImg>
          <div>{transI18n('fcr_popup_quiz_reward_correct')}</div>
        </div>
        <div className="fcr-poppu-quiz-reward-action-item" onClick={() => sendAward('all')}>
          <SvgImg type={SvgIconEnum.FCR_REWARD} size={20}></SvgImg>
          <div>{transI18n('fcr_popup_quiz_reward_all')}</div>
        </div>
      </div>
    </div>
  );
};

const ReviseQuizSelectPopover = ({ widget }: { widget: FcrPopupQuizWidget }) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const transI18n = useI18n();

  return (
    <Popover
      visible={popoverVisible}
      trigger="click"
      showArrow
      overlayOffset={8}
      placement="top"
      content={
        <ReviseQuizSelect
          onClose={() => setPopoverVisible(false)}
          widget={widget}></ReviseQuizSelect>
      }
      overlayInnerStyle={{ width: 228, height: 190 }}
      onVisibleChange={setPopoverVisible}>
      <Button size="XS" styleType="gray">
        {transI18n('fcr_popup_quiz_change')}
        <SvgImg
          type={SvgIconEnum.FCR_DROPDOWN}
          style={{
            transform: `rotate(${popoverVisible ? '0deg' : '180deg'})`,
            transition: '.3s all',
          }}
        />
      </Button>
    </Popover>
  );
};
const ReviseQuizSelect = ({
  widget,
  onClose,
}: {
  widget: FcrPopupQuizWidget;
  onClose: () => void;
}) => {
  const transI18n = useI18n();
  const [loading, setLoading] = useState(false);
  const { options, selectOption, selectedOptions, deselectOption } = useQuizSelect(
    widget.roomProperties.extra?.items || [],
    widget.roomProperties.extra?.correctItems || [],
  );
  const handleReviseCorrectItems = async () => {
    const popupQuizId = widget.roomProperties.extra.popupQuizId;
    const roomId = widget.classroomStore.connectionStore.sceneId;
    setLoading(true);
    await widget.classroomStore.api
      .updateAnswerCorrectItems(roomId, popupQuizId, selectedOptions)
      .finally(() => {
        setLoading(false);
      });
    onClose();
  };
  return (
    <div className="fcr-popup-quiz-host-revise-select-container">
      <div onClick={onClose} className="fcr-popup-quiz-host-revise-select-close">
        <SvgImg type={SvgIconEnum.FCR_CLOSE} size={10}></SvgImg>
      </div>
      <div className="fcr-popup-quiz-host-revise-select">
        {options.map((item) => {
          const selected = selectedOptions.includes(item);
          return (
            <div
              key={item}
              onClick={() => {
                selected ? deselectOption(item) : selectOption(item);
              }}
              className={classnames('fcr-popup-quiz-initialized-select-item', {
                'fcr-popup-quiz-initialized-select-item-active': selected,
              })}>
              {selected && (
                <div className="fcr-popup-quiz-initialized-select-item-select-icon">
                  <SvgImg type={SvgIconEnum.FCR_CHECKBOX_CHECK} size={12}></SvgImg>
                </div>
              )}
              {item}
            </div>
          );
        })}
      </div>
      <div className="fcr-popup-quiz-host-revise-select-actions">
        <Button size="XS" block shape="rounded" styleType="gray" onClick={onClose}>
          {transI18n('fcr_popup_quiz_change_cancel')}
        </Button>
        <Button
          size="XS"
          loading={loading}
          disabled={loading || selectedOptions.length <= 0}
          block
          shape="rounded"
          onClick={handleReviseCorrectItems}>
          {transI18n('fcr_popup_quiz_change_save')}
        </Button>
      </div>
    </div>
  );
};
