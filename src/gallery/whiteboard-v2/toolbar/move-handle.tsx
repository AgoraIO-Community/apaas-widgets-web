import { FC, PropsWithChildren, useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { ToolbarItem } from '.';
import { SvgIconEnum } from '@components/svg-img';
import { useDrag, State } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import classNames from 'classnames';
import { ToolbarUIContext } from '../ui-context';

export const MoveHandleItem = () => {
  const { setToolbarPosition, observables } = useContext(ToolbarUIContext);
  const bind = useDrag((p) => {
    const [mx, my] = (p as unknown as State['drag'])!.movement;

    const { x, y } = observables.toolbarDockPosition;
    setToolbarPosition({ x: x + mx, y: y + my });
  });

  return (
    <div {...bind()}>
      <ToolbarItem
        tooltip="Move"
        icon={SvgIconEnum.FCR_WHITEBOARD_MOVE}
        className="fcr-board-toolbar-handle"
        isActive={false}
      />
    </div>
  );
};

export const DraggableWrapper: FC<PropsWithChildren> = observer(({ children }) => {
  const { observables, dragToolbar, releaseToolbar } = useContext(ToolbarUIContext);
  const { toolbarPosition, toolbarReleased, toolbarDockPosition } = observables;
  const [{ x, y }, api] = useSpring(() => toolbarDockPosition);
  useEffect(() => {
    const mouseReleaseHandler = () => {
      releaseToolbar();
    };
    window.addEventListener('mouseup', mouseReleaseHandler);

    return () => {
      window.removeEventListener('mouseup', mouseReleaseHandler);
    };
  }, []);

  useEffect(() => {
    if (toolbarReleased) {
      api.start({ ...toolbarDockPosition, immediate: false });
    }
  }, [toolbarReleased]);

  useEffect(() => {
    dragToolbar();
    api.start({ x: toolbarPosition.x, y: toolbarPosition.y, immediate: true });
  }, [toolbarPosition.x, toolbarPosition.y]);

  const cls = classNames('fcr-board-toolbar', {
    'fcr-board-toolbar--left': toolbarDockPosition.placement === 'left',
    'fcr-board-toolbar--right': toolbarDockPosition.placement === 'right',
  });

  return (
    <animated.div style={{ left: x, top: y }} className={cls}>
      {children}
    </animated.div>
  );
});
