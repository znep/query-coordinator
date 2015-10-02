(() => {

  let componentUtilsNS = blist.namespace.fetch('blist.components.utils');

  componentUtilsNS.classNames = (...args) => {
    return _.map(args, (arg) => {
      if (_.isString(arg)) {
        return arg;
      } else if (_.isArray(arg)) {
        return componentUtilsNS.classNames(...arg);
      } else if (_.isObject(arg)) {
        return _.chain(arg).map((value, key) => value ? key : null).compact().value().join(' ');
      }
    }).join(' ');
  };

})();
