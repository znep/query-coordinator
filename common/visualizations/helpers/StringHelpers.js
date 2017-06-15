/**
 * Splits given text into chunks at maximum given character size
 * by respecting to word boundaries.
 *
 * @param {String} text
 * @param {Number} maxCharacters
 * @return {String[]}
 */
export function partitionByWordBoundaries(text, maxCharacters) {
  if (text.length <= maxCharacters) {
    return [text];
  }

  let chunks = [];
  let chunk = '';
  const words = text.split(' ');

  words.forEach((word) => {
    let merged = (chunk + ' ' + word).trim();

    if (merged.length <= maxCharacters) {
      chunk = merged;
    } else {
      chunks.push(chunk);
      chunk = word;
    }
  });

  if (chunk.length > 0) {
    chunks.push(chunk);
  }

  return chunks;
}
