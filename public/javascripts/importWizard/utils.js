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

export function removeAt(array, index) {
  const cloned = _.clone(array);
  cloned.splice(index, 1);
  return cloned;
}

// added in lodash 4
export function fromPairs(pairs) {
  const obj = {};
  pairs.forEach(([key, value]) => {
    obj[key] = value;
  });
  return obj;
}

// copied from https://github.com/socrata/frontend/blob/3c45a5755160a5a178e6926f994dd61951751a55/public/javascripts/screens/import-pane.js#L1937-L1937
// we should prob use an NPM package for this
export function escapeRegex(regex) {
  return regex.replace(
    /(\\|\^|\$|\?|\*|\+|\.|\(|\)|\{|\}|\|)/g,
    function(match) { return '\\' + match; }
  );
}
