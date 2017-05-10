import React from 'react';

import LocalizedLink from './Localization/LocalizedLink';

import * as helpers from '../helpers';

export default class AssetName extends React.Component {
  render() {
    const { activity } = this.props;
    const activityType = helpers.activities.getType(activity);
    const activityName = activity.getIn(['dataset', 'name']);

    if (activityType !== 'delete') {
      const activityUrl = helpers.activities.getUrl(activity);
      return <LocalizedLink url={activityUrl}>{activityName}</LocalizedLink>;
    }

    return <span>{activityName}</span>;
  }
}

AssetName.propTypes = {
  activity: React.PropTypes.object.isRequired
};
