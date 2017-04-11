import _ from 'lodash';
import React from 'react';

export default class Localization extends React.Component {
  constructor(props) {
    super(props);

    this.translate = this.translate.bind(this);
    this.getLocale = this.getLocale.bind(this);
  }

  getChildContext() {
    const { locale } = this.props;

    return {
      localization: {
        translate: (locale === 'nyan' ? (() => 'nyan') : this.translate),
        getLocale: this.getLocale
      }
    };
  }

  getLocale() {
    return this.props.locale;
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
  returnKeyForNotFound: false
};

Localization.propTypes = {
  translations: React.PropTypes.object.isRequired,
  locale: React.PropTypes.string.isRequired,
  notFoundText: React.PropTypes.string.isRequired,
  returnKeyForNotFound: React.PropTypes.bool.isRequired,
  root: React.PropTypes.string,
  children: React.PropTypes.any
};

Localization.childContextTypes = {
  localization: React.PropTypes.shape({
    translate: React.PropTypes.func,
    getLocale: React.PropTypes.func
  })
};
