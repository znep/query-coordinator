import _ from 'lodash';

export function updateAt(array, index, updater) {
  return _.map(array, (item, idx) => {
    if (idx === index) {
      return updater(item);
    } else {
      return item;
    }
  });
}

// added in lodash 4
export function fromPairs(pairs) {
  const obj = {};
  pairs.forEach(([key, value]) => {
    obj[key] = value;
  });
  return obj;
}
