import _ from 'lodash';
import React from 'react';
import I18nJS from 'i18n-js';
import pluralization from 'common/i18n/pluralization';

export default class Localization extends React.Component {
  constructor(props) {
    super(props);

    if (_.isUndefined(props.localePrefix)) {
      props.localePrefix = props.locale
    }

    // Two strategies for now.
    //
    // I18n-JS is the new one we should use going forward.
    I18nJS.locale = props.locale;
    I18nJS.pluralization[I18nJS.locale] = pluralization[I18nJS.locale];
    _.assign(I18nJS.translations, {
      [I18nJS.locale]: props.translations || window.translations
    })

    if (I18nJS.locale === 'nyan') {
      I18nJS.t = () => 'nyan';
    }

    // Old implementation that seems to be a port from Old UX.
    this.translate = this.translate.bind(this);
    this.getLocale = this.getLocale.bind(this);
    this.getLocalePrefix = this.getLocalePrefix.bind(this);
  }

  getChildContext() {
    const { locale } = this.props;

    return {
      I18n: I18nJS,
      localization: {
        translate: (locale === 'nyan' ? (() => 'nyan') : this.translate),
        getLocale: this.getLocale,
        getLocalePrefix: this.getLocalePrefix
      }
    };
  }

  getLocale() {
    return this.props.locale;
  }

  getLocalePrefix() {
    return this.props.localePrefix;
  }

  translate(key, data) {
    const { translations, returnKeyForNotFound, root } = this.props;
    key = root ? `${root}.${key}` : key;

    const notFoundText = returnKeyForNotFound ? key : this.props.notFoundText;
    let translation = _.get(translations, key, null);

    if (translation === null) {
      return notFoundText;
    }

    if (_.isPlainObject(translation) && _.has(data, 'count')) {
      if (data.count === 1) {
        translation = translation.one;
      } else {
        translation = translation.other;
      }

      if (_.isNil(translation)) {
        return notFoundText;
      }
    }

    return translation.replace(
      /%{[^}]+}/g,
      (dataKey) => (data || {})[dataKey.slice(2, -1)] || ''
    );
  }

  render() {
    return this.props.children;
  }
}

Localization.defaultProps = {
  notFoundText: '(no translation available)',
  returnKeyForNotFound: false,
  localePrefix: ''
};

Localization.propTypes = {
  translations: React.PropTypes.object.isRequired,
  locale: React.PropTypes.string.isRequired,
  notFoundText: React.PropTypes.string.isRequired,
  returnKeyForNotFound: React.PropTypes.bool.isRequired,
  root: React.PropTypes.string,
  children: React.PropTypes.any,
  localePrefix: React.PropTypes.string
};

Localization.childContextTypes = {
  I18n: React.PropTypes.object,
  localization: React.PropTypes.shape({
    translate: React.PropTypes.func,
    getLocale: React.PropTypes.func,
    getLocalePrefix: React.PropTypes.func
  })
};
