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

export function wordifyList(list: Array<string>) {
  if (list.length === 1) {
    return list[0];
  } else {
    const lastTwo = _.takeRight(list, 2);
    const allButLastTwo = _.dropRight(list, 2);
    const firstSection =
      allButLastTwo.length === 0
      ? ''
      : `${allButLastTwo.join(', ')}, `;
    const lastSection = `${lastTwo[0]} ${I18n.core.and} ${lastTwo[1]}`;
    return `${firstSection}${lastSection}`;
  }
}

// copied from https://github.com/socrata/frontend/blob/3c45a5755160a5a178e6926f994dd61951751a55/public/javascripts/screens/import-pane.js#L1937-L1937
// we should prob use an NPM package for this
export function escapeRegex(regex) {
  return regex.replace(
    /(\\|\^|\$|\?|\*|\+|\.|\(|\)|\{|\}|\|)/g,
    function(match) { return '\\' + match; }
  );
}
