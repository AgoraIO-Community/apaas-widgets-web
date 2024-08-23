export const urlRegex =
  /((https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/g;
export const splitTextAndUrls = (input: string) => {
  // 用于存储结果的数组
  const result: string[] = [];

  // 上一个匹配结束的位置
  let lastIndex = 0;

  // 查找所有匹配的 URL
  let match;
  while ((match = urlRegex.exec(input)) !== null) {
    // 如果在上一个 URL 和当前 URL 之间有文本，添加到结果中
    if (match.index > lastIndex) {
      const textSegment = input.slice(lastIndex, match.index);
      splitAndPreserveWhitespace(textSegment, result);
    }

    // 添加 URL 到结果中
    result.push(match[0]);

    // 更新 lastIndex
    lastIndex = urlRegex.lastIndex;
  }

  // 添加剩余的文本（如果有的话）
  if (lastIndex < input.length) {
    const remainingText = input.slice(lastIndex);
    splitAndPreserveWhitespace(remainingText, result);
  }

  return result;
};
const splitAndPreserveWhitespace = (text: string, result: string[]) => {
  const segments = text.split(/(\s+)/); // 按空格和换行符分割，并保留分隔符
  for (const segment of segments) {
    if (segment !== '') {
      result.push(segment);
    }
  }
};
