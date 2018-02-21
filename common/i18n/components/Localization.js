import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import I18nJS from 'i18n-js';
import pluralization from '../pluralization';
import { sift } from 'common/js_utils';

export const DEFAULT_LOCALE = 'en';

export default class Localization extends React.Component {
  constructor(props) {
    super(props);

    if (_.isUndefined(props.localePrefix)) {
      props.localePrefix = props.locale;
    }

    I18nJS.locale = props.locale;
    I18nJS.pluralization[I18nJS.locale] = pluralization(I18nJS.locale);

    this.assertKeysAreNew();
    I18nJS.translations[I18nJS.locale] =
      _.assign({}, I18nJS.translations[I18nJS.locale], props.translations);

    if (I18nJS.locale === 'nyan') {
      I18nJS.t = () => 'nyan';
    }

    _.bindAll(this, ['getLocalePrefix']);
  }

  assertKeysAreNew() { // eslint-disable-line react/sort-comp
    const { translations } = this.props;

    const overwrittenKeys = _.reject(_.intersection(
      _.keys(I18nJS.translations[I18nJS.locale]),
      _.keys(translations)
    ), (sharedKey) => {
      return _.isEqual(
        I18nJS.translations[I18nJS.locale][sharedKey],
        translations[sharedKey]
      );
    });

    if (!_.isEmpty(overwrittenKeys)) {
      console.warn(`Keys being overwritten: ${overwrittenKeys.join(', ')}`);
    }
  }

  getChildContext() {
    const { locale } = this.props;

    return {
      I18n: I18nJS,
      localization: {
        getLocalePrefix: this.getLocalePrefix
      }
    };
  }

  getLocalePrefix() {
    return this.props.localePrefix;
  }

  render() {
    return this.props.children;
  }
}

Localization.defaultProps = {
  notFoundText: '(no translation available)',
  returnKeyForNotFound: false,
  localePrefix: '',
  // EN-18438: for Data Lens, `datalensTranslations` are the latest translations containing the common/shared
  // keys. This is only because `window.translations` was already in use in the case of our Angular app.
  // For every other app, `window.translations` is the new set of translations containing common/shared keys.
  translations: sift(window, 'datalensTranslations', 'translations', 'blist.translations'),
  locale: sift(window, 'serverConfig.locale', 'blist.locale') || 'en'
};

Localization.propTypes = {
  translations: PropTypes.object,
  locale: PropTypes.string,
  notFoundText: PropTypes.string.isRequired,
  returnKeyForNotFound: PropTypes.bool.isRequired,
  children: PropTypes.any,
  localePrefix: PropTypes.string
};

Localization.childContextTypes = {
  I18n: PropTypes.object,
  localization: PropTypes.shape({
    getLocalePrefix: PropTypes.func
  })
};
