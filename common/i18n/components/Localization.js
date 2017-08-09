import _ from 'lodash';
import React from 'react';
import I18nJS from 'i18n-js';
import pluralization from '../pluralization';

export default class Localization extends React.Component {
  constructor(props) {
    super(props);

    if (_.isUndefined(props.localePrefix)) {
      props.localePrefix = props.locale
    }

    I18nJS.locale = props.locale;
    I18nJS.pluralization[I18nJS.locale] = pluralization(I18nJS.locale);
    _.assign(I18nJS.translations, { [I18nJS.locale]: props.translations })

    if (I18nJS.locale === 'nyan') {
      I18nJS.t = () => 'nyan';
    }

    _.bindAll(this, ['getLocalePrefix']);
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
  translations: window.translations || _.get(window, 'blist.translations'),
  locale: _.get(window, 'serverConfig.locale', _.get(window, 'blist.locale', 'en'))
};

Localization.propTypes = {
  translations: React.PropTypes.object,
  locale: React.PropTypes.string,
  notFoundText: React.PropTypes.string.isRequired,
  returnKeyForNotFound: React.PropTypes.bool.isRequired,
  root: React.PropTypes.string,
  children: React.PropTypes.any,
  localePrefix: React.PropTypes.string
};

Localization.childContextTypes = {
  I18n: React.PropTypes.object,
  localization: React.PropTypes.shape({
    getLocalePrefix: React.PropTypes.func
  })
};
