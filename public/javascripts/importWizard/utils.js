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
