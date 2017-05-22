import _ from 'lodash';

export function getPrecision(x) {
  if (_.isInteger(x) || !_.isFinite(x)) {
    return 1;
  }

  const places = _.toString(x).split('.')[1].length;
  return Math.pow(10, -places);
}

export function roundToPrecision(x, precision) {
  if (precision < 0 || !_.isFinite(x) || !_.isFinite(precision)) {
    return x;
  }

  const places = precision === 1 ? 0 : -Math.log10(precision);
  return _.round(x, _.round(places));
}
