import _ from 'lodash';

const template = (content, values) => values.reduce((str, value, index) => str.replace(`{${index}}`, value), content);

export default (translations, path, ...values) => {
  const translation = translations.getIn(_.toPath(path));

  if (values.length === 0) {
    return translation;
  }

  return template(translation, values);
};
