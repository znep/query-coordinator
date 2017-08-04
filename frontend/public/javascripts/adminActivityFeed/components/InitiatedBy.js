import React from 'react';
import * as helpers from '../helpers';

import LocalizedLink from 'common/i18n/components/LocalizedLink';

export default class InitiatedBy extends React.Component {
  render() {
    const { activity } = this.props;

    if (helpers.user.isSuperAdmin(activity)) {
      return (
        <LocalizedLink path={activity.getIn(['initiated_by', 'profile_url'])} className='unstyled-link'>
          <span>{helpers.user.getDisplayName(activity)}</span>
          <span> (Socrata)</span>
        </LocalizedLink>
      );
    } else {
      return (
        <LocalizedLink path={activity.getIn(['initiated_by', 'profile_url'])} className='unstyled-link'>
          {helpers.user.getDisplayName(activity)}
        </LocalizedLink>
      );
    }
  }
}

InitiatedBy.propTypes = {
  activity: React.PropTypes.object.isRequired
};
