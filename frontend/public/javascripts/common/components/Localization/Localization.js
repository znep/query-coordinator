import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

export default class Localization extends React.Component {
  constructor(props) {
    super(props);

    this.translate = this.translate.bind(this);
    this.getLocale = this.getLocale.bind(this);
    this.getLocalePrefix = this.getLocalePrefix.bind(this);
  }

  getChildContext() {
    const { locale } = this.props;

    return {
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
      /%{([^}]+)}/g,
      (match, key) => _.get(data, key, '')
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
  translations: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
  notFoundText: PropTypes.string.isRequired,
  returnKeyForNotFound: PropTypes.bool.isRequired,
  root: PropTypes.string,
  children: PropTypes.any,
  localePrefix: PropTypes.string
};

Localization.childContextTypes = {
  localization: PropTypes.shape({
    translate: PropTypes.func,
    getLocale: PropTypes.func,
    getLocalePrefix: PropTypes.func
  })
};
