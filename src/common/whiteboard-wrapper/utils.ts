import MD5 from 'js-md5';
import { Size } from 'white-web-sdk';
import { BaseImageSize, FetchImageResult } from './type';

/**
 * 根据
 * @param imageInnerSize
 * @returns
 */
export const getImageSize = (
  imageInnerSize: BaseImageSize,
  containerSize: BaseImageSize,
): BaseImageSize => {
  const windowSize = containerSize;
  const widthHeightProportion: number = imageInnerSize.width / imageInnerSize.height;
  const maxSize = 960;
  if (
    (imageInnerSize.width > maxSize && windowSize.width > maxSize) ||
    (imageInnerSize.height > maxSize && windowSize.height > maxSize)
  ) {
    if (widthHeightProportion > 1) {
      return {
        width: maxSize,
        height: maxSize / widthHeightProportion,
      };
    } else {
      return {
        width: maxSize * widthHeightProportion,
        height: maxSize,
      };
    }
  } else {
    if (imageInnerSize.width > windowSize.width || imageInnerSize.height > windowSize.height) {
      if (widthHeightProportion > 1) {
        return {
          width: windowSize.width,
          height: windowSize.width / widthHeightProportion,
        };
      } else {
        return {
          width: windowSize.height * widthHeightProportion,
          height: windowSize.height,
        };
      }
    } else {
      return {
        width: imageInnerSize.width,
        height: imageInnerSize.height,
      };
    }
  }
};

export function getImageSize1(file: File): Promise<Size> {
  const image = new Image();
  const url = URL.createObjectURL(file);
  const { innerWidth, innerHeight } = window;
  // shrink the image a little to fit the screen
  const maxWidth = innerWidth * 0.8;
  const maxHeight = innerHeight * 0.8;
  image.src = url;
  return new Promise((resolve) => {
    image.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = image;
      let scale = 1;
      if (width > maxWidth || height > maxHeight) {
        scale = Math.min(maxWidth / width, maxHeight / height);
      }
      resolve({ width: Math.floor(width * scale), height: Math.floor(height * scale) });
    };
    image.onerror = () => {
      resolve({ width: innerWidth, height: innerHeight });
    };
  });
}

/**
 *
 * @param url
 * @returns
 */
export const fetchImageInfoByUrl = async (
  url: string,
  containerSize: BaseImageSize,
): Promise<FetchImageResult> => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const contentType = blob.type;
    const image = new Image();
    const reader = new FileReader();
    const file = new File([blob], url, { type: contentType });
    const result = await new Promise((resolve) => {
      reader.readAsDataURL(blob);
      reader.onload = () => {
        image.addEventListener(
          'load',
          () => {
            const uuid = MD5(reader.result!);
            const res = getImageSize(image, containerSize);
            const result = {
              width: res.width,
              height: res.height,
              file: file,
              url,
              uuid,
            };
            resolve(result);
          },
          false,
        );
        image.src = reader.result as string;
      };
    });
    return result as FetchImageResult;
  } catch (err) {
    throw err;
  }
};

export const downloadCanvasImage = (
  canvas: HTMLCanvasElement,
  filename = 'fcr-board-snapshot.jpg',
) => {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL("image/jpeg");
  a.click();
};

export const paramsCanvasToList = async (scenes: (() => Promise<HTMLCanvasElement | null>)[]) => {
  const canvasArray = [];
  for (const canvasPromise of scenes) {
    const canvas = await canvasPromise();
    if (canvas) {
      canvasArray.push(canvas);
    }
  }
  return canvasArray;
};

export const downloadCanvasImageList = async(
  scenes: HTMLCanvasElement[],
  filename = 'fcr-board-snapshot.jpg',
) => {
  return new Promise<void>((resolve, reject) => {
    let haveEmpty = true;
    scenes.forEach( (canvas,index)=>{
      if(canvas != null && "data:," !== canvas?.toDataURL() && !isCanvasBlank(canvas)){
        haveEmpty = false;
       downloadCanvasImage(canvas,filename.replace(".jpg","_" + (index + 1)))
      }
      if(index == scenes.length - 1 && !haveEmpty){
        resolve();
      }
    })
    if(haveEmpty){
      reject();
    }
  });
};
/**
 * 判断图片是不是空白的
 */
function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext('2d');
  if (!context) {
    return false;
  }
  const pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 0; i < pixelData.length; i += 4) {
    if(!(pixelData[i] === 255 && pixelData[i + 1] === 255 && pixelData[i + 2] === 255)){
      return false;
    }
  }
  return true; // All pixels are transparent
}
