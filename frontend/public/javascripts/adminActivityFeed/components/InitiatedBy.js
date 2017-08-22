import React from 'react';
import * as helpers from '../helpers';

export default class InitiatedBy extends React.Component {
  render() {
    const { activity } = this.props;

    if (helpers.user.isSuperAdmin(activity)) {
      return (
        <div>
          <span>{helpers.user.getDisplayName(activity)}</span>
          <span> (Socrata)</span>
        </div>
      );
    } else {
      return <span>{helpers.user.getDisplayName(activity)}</span>;
    }
  }
}

InitiatedBy.propTypes = {
  activity: React.PropTypes.object.isRequired
};
