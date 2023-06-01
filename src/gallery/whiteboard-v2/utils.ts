export const heightPerTool = 36;
export const heightPerColor = 18;
export const defaultToolsRetain = heightPerTool * 6;
export const verticalPadding = 10;
export const sceneNavHeight = heightPerTool + verticalPadding;
export const widgetContainerClassName = 'netless-whiteboard-wrapper';
export const layoutContentClassName = 'fcr-layout-content-main-view';

export const WINDOW_TITLE_HEIGHT = 28;
// width / height
export const WINDOW_ASPECT_RATIO = 1836 / 847;

export const WINDOW_MIN_SIZE = { width: 653, height: 336 };
export const WINDOW_REMAIN_SIZE = { width: 830, height: 383 };
export const WINDOW_REMAIN_POSITION = { x: 0, y: 171 };

type Size = { width: number; height: number };

type Boundaries = Size & { top: number; left: number };

export const getMaxSizeInContainer = (containerSize: Size) => {
  let width = containerSize.width;
  let height = containerSize.width / WINDOW_ASPECT_RATIO + WINDOW_TITLE_HEIGHT;

  if (height > containerSize.height) {
    height = containerSize.height - WINDOW_TITLE_HEIGHT;
    width = height * WINDOW_ASPECT_RATIO;
    height = height + WINDOW_TITLE_HEIGHT;
  }

  return { width, height };
};

export const getDefaultBounds = (containerBoundaries: Boundaries) => {
  const maxSize = getMaxSizeInContainer(containerBoundaries);

  const x = (containerBoundaries.width - maxSize.width) / 2 + containerBoundaries.left;

  const y = (containerBoundaries.height - maxSize.height) / 2 + containerBoundaries.top;

  return { x, y, width: maxSize.width, height: maxSize.height };
};
