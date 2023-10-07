function getRandom(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
export class ThumbsUpAni {
  imgsList: HTMLImageElement[] = [];
  context: CanvasRenderingContext2D | null = null;
  width = 0;
  height = 0;
  scanning = false;
  dpr = 1;
  renderList: {
    render: ((diffTime: number) => true | undefined) | null;
    duration: number;
    timestamp: number;
  }[] = [];
  scaleTime = 0.1; // 百分比
  constructor(canvas: HTMLCanvasElement, imageList: string[]) {
    this.loadImages(imageList);
    this.context = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.width * this.dpr;
    canvas.height = canvas.height * this.dpr;
    this.context?.scale(this.dpr, this.dpr);
  }
  loadImages(imageList: string[]) {
    const promiseAll: Promise<HTMLImageElement>[] = [];
    imageList.forEach((src) => {
      const p = new Promise<HTMLImageElement>(function (resolve) {
        const img = new Image();
        img.onerror = img.onload = resolve.bind(null, img);
        img.src = src;
      });
      promiseAll.push(p);
    });
    Promise.all(promiseAll).then((imgsList: HTMLImageElement[]) => {
      this.imgsList = imgsList.filter((d) => {
        if (d && d.width > 0) return true;
        return false;
      });
    });
  }
  createRender() {
    if (this.imgsList.length == 0) return null;
    const basicScale = [0.4, 0.5, 0.6][getRandom(0, 2)];

    const getScale = (diffTime: number) => {
      if (diffTime < this.scaleTime) {
        return +(diffTime / this.scaleTime).toFixed(2) * basicScale;
      } else {
        return basicScale;
      }
    };
    const context = this.context;
    // 随机读取一个图片来渲染
    const image = this.imgsList[getRandom(0, this.imgsList.length - 1)];
    const offset = 2;
    const basicX = this.width / 2 + getRandom(-offset, offset);
    const angle = getRandom(2, 10);
    const ratio = getRandom(5, 10) * (getRandom(0, 1) ? 1 : -1);
    const getTranslateX = (diffTime: number) => {
      if (diffTime < this.scaleTime) {
        // 放大期间，不进行摇摆位移
        return basicX;
      } else {
        return basicX + ratio * Math.sin(angle * (diffTime - this.scaleTime));
      }
    };

    const getTranslateY = (diffTime: number) => {
      return image.height / 2 + (this.height - image.height / 2) * (1 - diffTime);
    };

    const fadeOutStage = getRandom(14, 18) / 100;
    const getAlpha = (diffTime: number) => {
      const left = 1 - +diffTime;
      if (left > fadeOutStage) {
        return 1;
      } else {
        return 1 - +((fadeOutStage - left) / fadeOutStage).toFixed(2);
      }
    };

    return (diffTime: number) => {
      if (!context) return;
      // 差值满了，即结束了 0 ---》 1
      if (diffTime >= 1) return true;
      context.save();
      const scale = getScale(diffTime);
      // const rotate = getRotate();
      const translateX = getTranslateX(diffTime);
      const translateY = getTranslateY(diffTime);

      context.translate(translateX, translateY);
      context.scale(scale, scale);
      // context.rotate(rotate * Math.PI / 180);
      context.globalAlpha = getAlpha(diffTime);
      context.drawImage(
        image,
        (-image.width * basicScale) / 2,
        -image.height / 2,
        image.width / 2,
        image.height / 2,
      );

      context.restore();
    };
  }
  scan() {
    if (!this.context) return;
    this.context.clearRect(0, 0, this.width, this.height);
    let index = 0;
    let length = this.renderList.length;
    if (length > 0) {
      requestFrame(this.scan.bind(this));
      this.scanning = true;
    } else {
      this.scanning = false;
    }
    while (index < length) {
      const child = this.renderList[index];
      if (
        !child ||
        !child.render ||
        child.render.call(null, (Date.now() - child.timestamp) / child.duration)
      ) {
        // 结束了，删除该动画
        this.renderList.splice(index, 1);
        length--;
      } else {
        // continue
        index++;
      }
    }
  }
  start() {
    const render = this.createRender();
    const duration = getRandom(1500, 3000);
    this.renderList.push({
      render,
      duration,
      timestamp: Date.now(),
    });
    if (!this.scanning) {
      this.scanning = true;
      requestFrame(this.scan.bind(this));
    }
    return this;
  }
}
function requestFrame(cb: () => void) {
  return (
    window.requestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  )(cb);
}
