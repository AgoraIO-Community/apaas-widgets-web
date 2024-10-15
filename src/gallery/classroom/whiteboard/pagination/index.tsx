import { FC, PropsWithChildren, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
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

  const { handleNext, handlePrev, current: innerCurrent } = usePageCounter({ current, total });
  const { fixedUndoItem } = useVisibleTools();

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
    <div className="fcr-pagination-half-r-wrapper">
      <div className={cls}>
        <div className="fcr-pagination__extra" onClick={onAdd}>
          <SvgImg type={SvgIconEnum.FCR_MOBILE_NEWWHITEBOARDPAGE} size={24} colors={{iconPrimary:'#151515'}} />
        </div>
        {total > 1 ? (
          <div className="fcr-pagination__expage">
            <div className="fcr-pagination__prev">
              <button className={prevCls} onClick={handlePrev}>
                <SvgImg type={SvgIconEnum.FCR_DROPUP4} size={24} colors={{iconPrimary:'#151515'}}/>
              </button>
            </div>
            <div
              className={classNames('fcr-pagination__page', {
                'flex-column': `${current}${total}`.length > 3,
              })}>
              <text className={classNames({ 'fcr-pagination_btn--disabled': innerCurrent <= 1 })}>
                <text>{current ?? 0}</text>/
              </text>
              <text
                className={classNames({ 'fcr-pagination_btn--disabled': innerCurrent >= total })}>
                {total ?? 0}
              </text>
            </div>
            <div className="fcr-pagination__next">
              <button className={nextCls} onClick={handleNext}>
                <SvgImg type={SvgIconEnum.FCR_DROPDOWN4} size={24} colors={{iconPrimary:'#151515'}}/>
              </button>
            </div>
          </div>
        ) : null}
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
