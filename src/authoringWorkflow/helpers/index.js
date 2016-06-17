import _ from 'lodash';

const unset = (object, path) => {
  var lastKeyMatches = path.match(/\[([^\[\.\]]+)\]|\.([^\[\.\]]+)$/);
  var pathWithoutLastKey = path.replace(lastKeyMatches[0], '');
  var lastKey = lastKeyMatches[1] || lastKeyMatches[2];

  if (lastKey) {
    var lastObject = _.get(object, pathWithoutLastKey);
    delete lastObject[lastKey];
  }
};

export const setValueOrDefaultValue = (object, path, value, defaultValue) => {
  var hasPath = _.has(object, path);

  if (isNonEmptyString(value)) {
    _.set(object, path, value);
  } else if (hasPath && !_.isUndefined(defaultValue)) {
    _.set(object, path, defaultValue);
  }
}

export const setValueOrDeleteProperty = (object, path, value) => {
  var hasPath = _.has(object, path);

  if (isNonEmptyString(value)) {
    _.set(object, path, value);
  } else if (hasPath) {
    unset(object, path);
  }
}

export const forEachSeries = (state, callback) => {
  _.each(state.series, callback);
};

export const isNonEmptyString = string => {
  return _.isString(string) && string.trim().length > 0;
};
