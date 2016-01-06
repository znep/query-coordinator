export const classNames = (...args) => (
  _.map(args, (arg) => {
    if (_.isString(arg)) {
      return arg;
    } else if (_.isArray(arg)) {
      return classNames(...arg);
    } else if (_.isObject(arg)) {
      return _.chain(arg).map((value, key) => value ? key : null).compact().value().join(' ');
    }
  }).join(' ')
);
