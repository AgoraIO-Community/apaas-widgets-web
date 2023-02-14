import { observer } from 'mobx-react';
import { useEffect, useRef } from 'react';
import { SvgIconEnum, SvgImgMobile } from '../../../../../../../components/svg-img';
import { ThumbsUpAni } from './thumbsup';
import './index.css';
import { useStore } from '../../../../hooks/useStore';
import { ComponentLevelRulesMobile } from '../../../../../../../../../agora-classroom-sdk/src/infra/capabilities/config';

const ctxRequire = require.context('./assets/', false, /\.svg$/);
const thumbsupImgList: string[] = ctxRequire.keys().map((img) => {
  return ctxRequire(img);
});
export const Thumbsup = observer(() => {
  const {
    roomStore: { isLandscape, thumbsupRenderCache, thumbsup, setThumbsUpAni },
  } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbsupAniRef = useRef<ThumbsUpAni | null>(null);
  const thumbsUp = () => {
    thumbsupAniRef.current?.start();
    thumbsup();
  };
  useEffect(() => {
    if (canvasRef.current) {
      resizeCanvasToDisplaySize(canvasRef.current);
      thumbsupAniRef.current = new ThumbsUpAni(canvasRef.current, thumbsupImgList);
      setThumbsUpAni(thumbsupAniRef.current);
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
    <div className="fcr-chatroom-h5-inputs-thumbsup">
      <div className="fcr-chatroom-h5-inputs-thumbsup-count">
        {formatCount(thumbsupRenderCache)}
      </div>
      <SvgImgMobile
        landscape={isLandscape}
        type={SvgIconEnum.THUMBSUP}
        onClick={thumbsUp}
        size={30}></SvgImgMobile>
      <canvas
        style={{
          zIndex: ComponentLevelRulesMobile.Level2,
        }}
        ref={canvasRef}
        className="fcr-chatroom-h5-inputs-thumbsup-canvas"></canvas>
    </div>
  );
});
const formatCount = (count: number) => {
  return count >= 10000 ? `${(count / 10000).toFixed(1)}w` : count;
};
