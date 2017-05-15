import _ from 'lodash';

export default (services) => {
  const serviceGetter = (serviceName) => {
    const service = services[serviceName];

    if (_.isUndefined(service)) {
      throw new Error(`${serviceName} service doesn't exists!`);
    }

    return service;
  };

  return () => (next) => (action) => {
    if (typeof action === 'function') {
      return next(action(serviceGetter));
    }

    return next(action);
  };
};
