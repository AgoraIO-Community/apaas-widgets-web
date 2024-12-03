import { observer } from 'mobx-react';
import { useEffect, useRef } from 'react';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../../components/svg-img';
import { ThumbsUpAni } from './thumbs-up';
import './index.css';
import { useStore } from '../../../../hooks/useStore';

const ctxRequire = require.context('./assets/', false, /\.svg$/);
const thumbsUpImgList: string[] = ctxRequire.keys().map((img) => {
  return ctxRequire(img);
});
export const ThumbsUp = observer(() => {
  const {
    roomStore: { isLandscape, forceLandscape, thumbsUpRenderCache, thumbsUp, setThumbsUpAni },
  } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbsUpAniRef = useRef<ThumbsUpAni | null>(null);
  const handleThumbsUp = () => {
    thumbsUpAniRef.current?.start();
    thumbsUp();
  };
  useEffect(() => {
    if (canvasRef.current) {
      resizeCanvasToDisplaySize(canvasRef.current);
      thumbsUpAniRef.current = new ThumbsUpAni(canvasRef.current, thumbsUpImgList);
      setThumbsUpAni(thumbsUpAniRef.current);
    }
  }, []);
  const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement) => {
    // look up the size the canvas is being displayed
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // If it's resolution does not match change it
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }

    return false;
  };

  return (
    <div className="fcr-chatroom-mobile-inputs-thumbs-up">
      <div className="fcr-chatroom-mobile-inputs-thumbs-up-count">
        {formatCount(thumbsUpRenderCache)}
      </div>
      <SvgImgMobile
        forceLandscape={forceLandscape}
        landscape={isLandscape}
        type={SvgIconEnum.THUMBS_UP}
        onClick={handleThumbsUp}
        size={30}></SvgImgMobile>
      <canvas
        style={{
          zIndex: 10,
        }}
        ref={canvasRef}
        className="fcr-chatroom-mobile-inputs-thumbs-up-canvas"></canvas>
    </div>
  );
});
const formatCount = (count: number) => {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count;
};
