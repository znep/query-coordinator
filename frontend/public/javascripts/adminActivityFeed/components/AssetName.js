import React from 'react';

import LocalizedLink from './Localization/LocalizedLink';
import LocalizedText from './Localization/LocalizedText';

import * as helpers from '../helpers';

export default class AssetName extends React.Component {
  render() {
    const { activity } = this.props;

    if (activity.get('dataset')) {
      const activityName = activity.getIn(['dataset', 'name']);

      if (activity.getIn(['dataset', 'deleted'])) { // Dataset marked deleted but still remains.
        return (
          <div>
            <span>{activityName}</span> <LocalizedText className='asset-deleted' localeKey='index_page.deleted' />
          </div>
        );
      } else { // Present dataset
        const activityUrl = helpers.activities.getUrl(activity);
        return <LocalizedLink url={activityUrl}>{activityName}</LocalizedLink>;
      }
    } else { // Case of dataset is nil
      return <LocalizedText className='asset-deleted' localeKey='index_page.deleted_dataset' />;
    }
  }
}

AssetName.propTypes = {
  activity: React.PropTypes.object.isRequired
};
