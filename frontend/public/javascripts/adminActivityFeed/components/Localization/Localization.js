import _ from 'lodash';
import React from 'react';

/**
 * TODO: EN-17923 - This code should be removed in favor of the code in `common/components/Localization`
 */

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
  translations: React.PropTypes.object.isRequired,
  locale: React.PropTypes.string.isRequired,
  notFoundText: React.PropTypes.string.isRequired,
  returnKeyForNotFound: React.PropTypes.bool.isRequired,
  root: React.PropTypes.string,
  children: React.PropTypes.any,
  localePrefix: React.PropTypes.string
};

Localization.childContextTypes = {
  localization: React.PropTypes.shape({
    translate: React.PropTypes.func,
    getLocale: React.PropTypes.func,
    getLocalePrefix: React.PropTypes.func
  })
};
