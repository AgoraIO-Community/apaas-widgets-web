export const generateShortUserName = (name: string) => {
  const names = name.split(' ');
  const [firstWord] = names;
  const lastWord = names[names.length - 1];
  const firstLetter = firstWord.split('')[0];
  const secondLetter =
    names.length > 1 ? lastWord.split('')[0] : lastWord.length > 1 ? lastWord.split('')[1] : '';
  return `${firstLetter}${secondLetter}`.toUpperCase();
};
