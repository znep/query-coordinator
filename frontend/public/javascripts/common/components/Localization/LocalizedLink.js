import _ from 'lodash';
import React from 'react';

export default class LocalizedLink extends React.Component {
  render() {
    const { localization } = this.context;
    const localePrefix = localization.getLocalePrefix();
    const url = `${localePrefix}${this.props.url}`;

    const linkProps = _.omit(this.props, ['url', 'children']);
    return <a href={url} {...linkProps}>{this.props.children}</a>;
  }
}

LocalizedLink.propTypes = {
  url: React.PropTypes.any.isRequired,
  children: React.PropTypes.any
};

LocalizedLink.contextTypes = {
  localization: React.PropTypes.object
};
