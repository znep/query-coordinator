import _ from 'lodash';

export default (translations, path) => {
  const opPath = ['open_performance'].concat(path);
  const override = _.get(window.strings, opPath);
  return override ? override : translations.getIn(path);
};
