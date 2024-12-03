import { canUseDom } from './can-use-dom';
import { isDev } from './is-dev';
import { devError } from './dev-log';
let tenPxTester = null;
let tester = null;
if (canUseDom) {
  window.onload = function () {
    tenPxTester = document.createElement('div');
    tenPxTester.className = 'adm-px-tester';
    tenPxTester.style.setProperty('--size', '10');
    document.body.appendChild(tenPxTester);
    tester = document.createElement('div');
    tester.className = 'adm-px-tester';
    document.body.appendChild(tester);
  };
}
export function convertPx(px) {
  if (tenPxTester === null || tester === null) return px;
  if (tenPxTester.getBoundingClientRect().height === 10) {
    return px;
  }
  tester.style.setProperty('--size', px.toString());
  return tester.getBoundingClientRect().height;
}
