export const heightPerTool = 36;
export const heightPerColor = 18;
export const defaultToolsRetain = heightPerTool * 6;
export const verticalPadding = 10;
export const sceneNavHeight = heightPerTool + verticalPadding;
export const widgetContainerClassName = 'netless-whiteboard-wrapper';
export const layoutContentClassName = 'fcr-layout-content-main-view';
export const videoRowClassName = 'fcr-layout-content-video-list-row';

export const toolbarClassName = 'fcr-board-toolbar';
export const windowClassName = 'netless-whiteboard-wrapper';

export const WINDOW_TITLE_HEIGHT = 28;
// width / height
export const WINDOW_ASPECT_RATIO = 1836 / 847;

export const WINDOW_MIN_SIZE = { width: 653, height: 336 };
export const WINDOW_REMAIN_SIZE = { width: 783, height: 388 };
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
  if (isHorizontalLayout()) {
    containerBoundaries.height = containerBoundaries.height - 58;
  }

  const maxSize = getMaxSizeInContainer(containerBoundaries);

  const x = (containerBoundaries.width - maxSize.width) / 2 + containerBoundaries.left;

  const y = (containerBoundaries.height - maxSize.height) / 2 + containerBoundaries.top;

  return { x, y, width: maxSize.width, height: maxSize.height };
};

export const clampBounds = (selfBoundaries: Boundaries, containerBoundaries: Boundaries) => {
  const newBounds = {
    width: selfBoundaries.width,
    height: selfBoundaries.height,
    x: selfBoundaries.left,
    y: selfBoundaries.top,
  };
  if (selfBoundaries.left < containerBoundaries.left) {
    newBounds.x = containerBoundaries.left;
  }

  if (selfBoundaries.top < containerBoundaries.top) {
    newBounds.y = containerBoundaries.top;
  }

  if (
    selfBoundaries.width + selfBoundaries.left >
    containerBoundaries.width + containerBoundaries.left
  ) {
    newBounds.width = containerBoundaries.width + containerBoundaries.left - selfBoundaries.left;
  }

  if (
    selfBoundaries.height + selfBoundaries.top >
    containerBoundaries.height + containerBoundaries.top
  ) {
    newBounds.height = containerBoundaries.height + containerBoundaries.top - selfBoundaries.top;
  }

  return newBounds;
};

export const isHorizontalLayout = () => {
  const clasNameExists = document.querySelector(`.${videoRowClassName}`);

  return !!clasNameExists;
};
