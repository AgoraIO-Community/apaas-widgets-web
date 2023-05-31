export const WINDOW_TITLE_HEIGHT = 36;
// width / height
export const WINDOW_ASPECT_RATIO = 1836 / 847;

export const WINDOW_DEFAULT_POSITION = { x: 0, y: 171 };

type Size = { width: number; height: number };

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
