import _ from 'lodash';
import React from 'react';

import LocalizedLink from 'common/i18n/components/LocalizedLink';

export default class UserName extends React.Component {
  render() {
    const { user } = this.props;
    const userName = user.get('screenName', '');
    const userSlug = _.kebabCase(userName);
    const userId = user.get('id');
    const profileUrl = `/profile/${userSlug}/${userId}`;

    return <LocalizedLink url={profileUrl}>{userName}</LocalizedLink>;
  }
}

UserName.propTypes = {
  user: React.PropTypes.object.isRequired
};
