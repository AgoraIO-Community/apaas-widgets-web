import { FC, PropsWithChildren, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { ToolbarItem } from '.';
import { SvgIconEnum } from '@components/svg-img';
import { useDrag, State } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import classNames from 'classnames';
import { ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';

export const MoveHandleItem = () => {
  const { setToolbarPosition, dragToolbar, observables } = useContext(ToolbarUIContext);
  const transI18n = useI18n();
  const bind = useDrag((p) => {
    const [mx, my] = (p as unknown as State['drag'])!.movement;

    const { x = 0, y = 0 } = observables.toolbarDockPosition;
    setToolbarPosition({ x: x + mx, y: y + my });
    dragToolbar();
  });

  return (
    <div {...bind()}>
      <ToolbarItem
        tooltipPlacement={observables.toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
        tooltip={transI18n('fcr_board_tool_move')}
        icon={SvgIconEnum.FCR_WHITEBOARD_MOVE}
        className="fcr-board-toolbar-handle"
        isActive={false}
      />
    </div>
  );
};

export const DraggableWrapper: FC<PropsWithChildren<{ className?: string }>> = observer(
  ({ children, className }) => {
    const { observables, releaseToolbar } = useContext(ToolbarUIContext);
    const { toolbarPosition, toolbarReleased, toolbarDockPosition, layoutReady } = observables;
    const [{ x, y }, api] = useSpring<{ x: number; y: number }>({}, []);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      const mouseReleaseHandler = () => {
        releaseToolbar();
      };
      const dom = document.querySelector('.netless-whiteboard-wrapper .fcr-widget-dialog-content');
      if (dom) {
        dom.addEventListener('mouseup', mouseReleaseHandler);
      }

      return () => {
        if (dom) {
          dom.removeEventListener('mouseup', mouseReleaseHandler);
        }
      };
    }, []);

    useEffect(() => {
      if (layoutReady) {
        api.start({ x: toolbarPosition.x, y: toolbarPosition.y, immediate: !toolbarReleased });
      }
    }, [toolbarPosition.x, toolbarPosition.y, toolbarReleased, layoutReady]);

    useEffect(() => {
      if (layoutReady) {
        api.start({
          x: toolbarDockPosition.x,
          y: toolbarDockPosition.y,
          immediate: !toolbarReleased,
        });
      }
    }, [toolbarDockPosition.x, toolbarDockPosition.y, toolbarReleased, layoutReady]);

    useLayoutEffect(() => {
      if (layoutReady) {
        setVisible(true);
      }
    }, [layoutReady]);

    const cls = classNames(
      'fcr-board-toolbar',
      {
        'fcr-board-toolbar--left': toolbarDockPosition.placement === 'left',
        'fcr-board-toolbar--right': toolbarDockPosition.placement === 'right',
      },
      className,
    );

    const visibility: 'hidden' | undefined = visible ? undefined : 'hidden';

    return (
      <animated.div style={{ left: x, top: y, visibility }} className={cls}>
        {children}
      </animated.div>
    );
  },
);
