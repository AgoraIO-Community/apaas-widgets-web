import { FC, PropsWithChildren, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { SvgIconEnum, SvgImg } from './../../../../../../fcr-ui-kit/src/components/svg-img';
import './index.css';
import { useVisibleTools } from '../toolbar/hooks';

type PaginationProps = {
  current: number;
  total: number;
  onChange?: (current: number) => void;
};

const usePageCounter = (context: { current: number; total: number }) => {
  const [current, setCurrent] = useState(context.current);
  useEffect(() => {
    setCurrent(context.current);
  }, [context.current]);

  const handlePrev = () => {
    if (current <= 1) {
      return;
    }
    setCurrent(current - 1);
  };

  const handleNext = () => {
    if (current >= context.total) {
      return;
    }
    setCurrent(current + 1);
  };

  return {
    current,
    handlePrev,
    handleNext,
  };
};

export const Pagination: FC<PaginationProps & { size?: 'large' | 'small' }> = ({
  current,
  total,
  onChange = () => {},
  size = 'large',
}) => {
  const cls = classNames('fcr-pagination', { 'fcr-pagination-small': size === 'small' });

  const { handleNext, handlePrev, current: innerCurrent } = usePageCounter({ current, total });

  useEffect(() => {
    onChange(innerCurrent);
  }, [innerCurrent]);

  const prevCls = classNames(
    'fcr-pagination__btn',
    innerCurrent <= 1 ? 'fcr-pagination_btn--disabled' : 'fcr-btn-click-effect',
  );

  const nextCls = classNames(
    'fcr-pagination__btn',
    innerCurrent >= total ? 'fcr-pagination_btn--disabled' : 'fcr-btn-click-effect',
  );

  return (
    <div className={cls}>
      <div className="fcr-pagination__prev">
        <button className={prevCls} onClick={handlePrev}>
          <SvgImg type={SvgIconEnum.FCR_DROPUP4} />
        </button>
      </div>
      <div className="fcr-divider" />
      <div className="fcr-pagination__page">
        {current ?? 0}/{total ?? 0}
      </div>
      <div className="fcr-divider" />
      <div className="fcr-pagination__next">
        <button className={nextCls} onClick={handleNext}>
          <SvgImg type={SvgIconEnum.FCR_DROPDOWN4} />
        </button>
      </div>
    </div>
  );
};

type HalfRoundedProps = PaginationProps & {
  onAdd?: () => void;
  addText?: string;
  showText?: string;
  hideText?: string;
};

export const HalfRoundedPagination: FC<HalfRoundedProps> = ({
  current,
  total,
  onAdd = () => {},
  onChange = () => {},
  addText,
  showText,
  hideText,
}) => {
  const cls = classNames('fcr-mobile-pagination fcr-pagination-half-r', {});

  const [expansionVisible, setExpansionVisible] = useState(false);

  const [expanded, setExpanded] = useState(true);

  const { handleNext, handlePrev, current: innerCurrent } = usePageCounter({ current, total });
  const { fixedUndoItem } = useVisibleTools();

  useEffect(() => {
    onChange(innerCurrent);
  }, [innerCurrent]);

  const handleExpand = () => {
    setExpanded((expanded) => !expanded);
  };

  const prevCls = classNames(
    'fcr-pagination__btn',
    innerCurrent <= 1 ? 'fcr-pagination_btn--disabled' : 'fcr-btn-click-effect',
  );

  const nextCls = classNames(
    'fcr-pagination__btn',
    innerCurrent >= total ? 'fcr-pagination_btn--disabled' : 'fcr-btn-click-effect',
  );

  const handleHover = (visible: boolean) => () => {
    setExpansionVisible(visible);
  };

  return (
    <div
      className="fcr-pagination-half-r-wrapper"
      onTouchStart={handleHover(true)}
      onTouchEnd={handleHover(false)}>
      <div className={cls}>
        <div className="fcr-pagination__extra" onClick={onAdd}>
          <SvgImg type={SvgIconEnum.FCR_MOBILE_NEWWHITEBOARDPAGE} size={24} />
        </div>
        <div className="fcr-pagination__expage">
          <div className="fcr-pagination__prev">
            <button className={prevCls} onClick={handlePrev}>
              <SvgImg type={SvgIconEnum.FCR_DROPUP4} size={24} />
            </button>
          </div>
          <div className="fcr-pagination__page">
            <p className="page__number">
              {current ?? 0}
              <text>/</text>
            </p>
            <text className="page__number">{total ?? 0}</text>
          </div>
          <div className="fcr-pagination__next">
            <button className={nextCls} onClick={handleNext}>
              <SvgImg type={SvgIconEnum.FCR_DROPDOWN4} size={24} />
            </button>
          </div>
        </div>
        {/* history options */}
        <div className="fcr-pagination__exundo">
          {fixedUndoItem.map(({ renderItem }, i) => {
            return <div key={i.toString()}>{renderItem()}</div>;
          })}
        </div>
      </div>
    </div>
  );
};

interface ListViewPaginationProps extends PaginationProps {
  wrapperCls?: string;
  direction?: 'row' | 'col';
}
export const ListViewPagination: FC<PropsWithChildren<ListViewPaginationProps>> = ({
  wrapperCls,
  current,
  total,
  onChange = () => {},
  direction = 'row',
  children,
}) => {
  const { current: innerCurrent, handleNext, handlePrev } = usePageCounter({ current, total });

  useEffect(() => {
    onChange(innerCurrent);
  }, [innerCurrent]);
  const prevBtnDisabled = innerCurrent <= 1;
  const prevCls = classNames(
    'fcr-pagination-float__btn',
    prevBtnDisabled ? 'fcr-pagination_btn--disabled' : 'fcr-btn-click-effect',
  );
  const nextBtnDisabled = innerCurrent >= total;
  const nextCls = classNames(
    'fcr-pagination-float__btn',
    nextBtnDisabled ? 'fcr-pagination_btn--disabled' : 'fcr-btn-click-effect',
  );

  return (
    <div
      className={classNames(
        'fcr-pagination-list-view',
        `fcr-pagination-list-view-${direction}`,
        wrapperCls,
      )}>
      {!prevBtnDisabled && (
        <div className="fcr-pagination-list-view__prev">
          <button className={prevCls} onClick={handlePrev}>
            <SvgImg type={SvgIconEnum.FCR_LEFT1} size={40} />
          </button>
        </div>
      )}
      {children}
      {!nextBtnDisabled && (
        <div className="fcr-pagination-list-view__next">
          <button className={nextCls} onClick={handleNext}>
            <SvgImg type={SvgIconEnum.FCR_LEFT1} size={40} />
          </button>
        </div>
      )}
    </div>
  );
};
