import _ from 'lodash';

// Converting camelCase params to snake_case params
export const toApiParams = (alertParams) => {
  let formattedAlertParams = _.mapKeys(alertParams, (value, key) => _.snakeCase(key));
  return _.omitBy(formattedAlertParams, _.isNil);
};

// Converting snake_case output to camelCase output
export const fromApiParams = (alertResults) => {
  return _.map(alertResults, (alert) =>
    _.mapKeys(alert, (value, key) => _.camelCase(key))
  );
};
