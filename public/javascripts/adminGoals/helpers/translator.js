import _ from 'lodash';

const template = (content, values) => values.reduce((str, value, index) => str.replace(`{${index}}`, value), content);

/**
 * Returns rendered translation found at given path. If the found translation
 * has some template placeholders, given values array items will be placed.
 *
 * @param {Map} translations
 * @param {String} path
 * @param {Array} values
 * @returns {String}
 */
export default (translations, path, ...values) => {
  const translation = translations.getIn(_.toPath(path));

  if (values.length === 0) {
    return translation;
  }

  return template(translation, values);
};
