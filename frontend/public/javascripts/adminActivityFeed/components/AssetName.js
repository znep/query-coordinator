import React from 'react';

import LocalizedLink from 'common/i18n/components/LocalizedLink';
import LocalizedText from 'common/i18n/components/LocalizedText';

import * as helpers from '../helpers';

export default class AssetName extends React.Component {
  render() {
    const { activity } = this.props;

    if (activity.get('dataset')) {
      let activityName = activity.getIn(['dataset', 'name']);
      if (activityName.length > 200) {
        activityName = activityName.substr(0, 200) + '...';
      }

      if (activity.getIn(['dataset', 'deleted'])) { // Dataset marked deleted but still remains.
        return (
          <div>
            <span className='asset-name'>{activityName} </span>
            <LocalizedText className='asset-deleted' localeKey='screens.admin.jobs.index_page.deleted' />
          </div>
        );
      } else { // Present dataset
        const activityUrl = helpers.activities.getUrl(activity);
        return (
          <span className='asset-name without-extra'>
            <LocalizedLink className='unstyled-link' path={activityUrl}>{activityName}</LocalizedLink>
          </span>
        );
      }
    } else { // Case of dataset is nil
      return <LocalizedText className='asset-deleted' localeKey='screens.admin.jobs.index_page.deleted_dataset' />;
    }
  }
}

AssetName.propTypes = {
  activity: React.PropTypes.object.isRequired
};
