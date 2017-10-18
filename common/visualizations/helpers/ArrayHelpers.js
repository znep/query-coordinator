import _ from 'lodash';
import encoding from 'text-encoding';


export function chunkArrayByLength(arr, maxChunkLength = 1400, chunkByBytes = true) {
  const chunkFn = (chunkByBytes
                   ? (str) => (new encoding.TextEncoder('utf-8').encode(str)).length
                   : (str) => _.size(str));
  let res = [];
  let currentChunk = [];
  let currentChunkLength = 0;
  _.forEach(arr, (elt) => {
    currentChunk.push(elt);
    currentChunkLength += chunkFn(elt);
    if (currentChunkLength >= maxChunkLength) {
      res.push(currentChunk);
      currentChunk = [];
      currentChunkLength = 0;
    }
  });
  if (currentChunkLength !== 0) {
    res.push(currentChunk);
  }
  return res;
}
