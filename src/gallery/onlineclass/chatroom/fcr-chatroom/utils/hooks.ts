import { useEffect, useRef } from 'react';

export const clickAnywhere = (el: HTMLElement, cb: () => void) => {
  const propaHandler = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const callbackHandler = () => {
    setTimeout(cb, 300);
  };

  el.addEventListener('mousedown', propaHandler);
  window.addEventListener('mousedown', callbackHandler);

  return () => {
    el.addEventListener('mousedown', propaHandler);
    window.removeEventListener('mousedown', callbackHandler);
  };
};
export const useClickAnywhere = (cb: () => void) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      return clickAnywhere(ref.current, cb);
    }
  }, []);

  return ref;
};
