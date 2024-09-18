function textNodesUnder(node: Node | null | undefined) {
  // https://stackoverflow.com/a/10730777/3245937
  let all = [] as Node[];
  for (node = node?.firstChild; node; node = node.nextSibling) {
    if (node.nodeType == 3) {
      all.push(node);
    } else {
      all = all.concat(textNodesUnder(node));
    }
  }
  return all;
}
export function setCaretIndex(win: Window, contentEditable: Node, newCaretIndex: number) {
  let cumulativeIndex = 0;
  let relativeIndex = 0;
  let targetNode: null | Node = null;

  const textNodes = textNodesUnder(contentEditable);

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];

    if (newCaretIndex <= cumulativeIndex + (node.textContent?.length || 0)) {
      targetNode = node;
      relativeIndex = newCaretIndex - cumulativeIndex;
      break;
    }

    cumulativeIndex += node.textContent?.length || 0;
  }

  const range = win.document.createRange();
  range.setStart(targetNode!, relativeIndex);
  range.setEnd(targetNode!, relativeIndex);
  range.collapse();

  const sel = win.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export function getCaretIndex(win: Window, contentEditable: Node) {
  let index = 0;
  const selection = win.getSelection();
  const textNodes = textNodesUnder(contentEditable);

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    const isSelectedNode = node === selection?.focusNode;

    if (isSelectedNode) {
      index += selection.focusOffset;
      break;
    } else {
      index += node.textContent?.length || 0;
    }
  }

  return index;
}
