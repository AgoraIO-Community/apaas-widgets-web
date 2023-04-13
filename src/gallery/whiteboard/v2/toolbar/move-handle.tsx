import { FC, PropsWithChildren, useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { ToolbarItem } from '.';
import { ToolbarUIContext } from '../../ui-context';
import { SvgIconEnum } from '@components/svg-img';
import { useDrag, State } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

export const MoveHandleItem = () => {
  const { setToolbarPosition, setToolbarDockPosition } = useContext(ToolbarUIContext);
  const bind = useDrag((p) => {
    const [mx, my] = (p as unknown as State['drag'])!.movement;
    if (mx > window.innerWidth / 2) {
      setToolbarDockPosition({ x: window.innerWidth - 50, y: 0 });
    } else {
      setToolbarDockPosition({ x: 0, y: 0 });
    }
    setToolbarPosition({ x: mx, y: my });
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

  return (
    <animated.div style={{ left: x, top: y }} className="fcr-board-toolbar">
      {children}
    </animated.div>
  );
});
