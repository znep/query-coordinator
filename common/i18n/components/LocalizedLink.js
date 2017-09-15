import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

export default class LocalizedLink extends React.Component {
  render() {
    const { I18n, localization } = this.context;
    const localePrefix = localization.getLocalePrefix();
    const url = `${localePrefix}${this.props.path}`;

    const linkProps = _.omit(this.props, ['path', 'children']);
    return <a href={url} {...linkProps}>{this.props.children}</a>;
  }
}

LocalizedLink.propTypes = {
  path: PropTypes.any.isRequired
};

LocalizedLink.contextTypes = {
  I18n: PropTypes.object,
  localization: PropTypes.object
};
