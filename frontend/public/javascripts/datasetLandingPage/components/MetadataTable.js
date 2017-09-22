import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { MetadataTable as CommonMetadataTable } from 'common/components';
import { localizeLink } from '../../common/locale';
import WatchDatasetButton from './WatchDatasetButton/WatchDatasetButton';
import { FeatureFlags } from 'common/feature_flags';

// TODO: This allows the tests to stay in the same place; remove it once the tests move to karma/common
export const MetadataTable = CommonMetadataTable;

function mapStateToProps(state) {
  const view = state.view || {};
  const { coreView } = view;

  const customFieldsets = view.customMetadataFieldsets || [];
  const userNotificationsEnabled = FeatureFlags.value('enable_user_notifications') === true;

  // TODO - move to common implementation.
  const customMetadataFieldsets = customFieldsets.reduce((acc, fieldset) => {
    const currentAvailableFields = fieldset.fields.map(field => field.name);

    // Have to perform this check in case user deletes a field but we still have
    // data for it.
    const customFields = _.pickBy(fieldset.existing_fields, (v, k) =>
      currentAvailableFields.includes(k));

    return {
      ...acc,
      [fieldset.name]: {
        ...customFields
      }
    };
  }, {});

  return ({
    localizeLink,
    coreView,
    customMetadataFieldsets,
    disableContactDatasetOwner: view.disableContactDatasetOwner,
    editMetadataUrl: view.editMetadataUrl,
    statsUrl: view.statsUrl,
    view: view,
    renderWatchDatasetButton() {
      if (_.get(window, 'sessionData.email', '') !== '' && userNotificationsEnabled) {
        return (<WatchDatasetButton view={view} />);
      } else {
        return null;
      }
    }
  });
}

function mapDispatchToProps(dispatch) {
  return {
    onClickEditMetadata() {
      const payload = {
        name: 'Edited Metadata',
        properties: {
          'From Page': 'DSLP'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onClickStats() {
      const payload = {
        name: 'Viewed Dataset Statistics',
        properties: {
          'From Page': 'DSLP'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onExpandTags() {
      const payload = {
        name: 'Expanded Details',
        properties: {
          'Expanded Target': 'Tags'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onExpandMetadataTable() {
      const payload = {
        name: 'Expanded Details',
        properties: {
          'Expanded Target': 'Metadata Table'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CommonMetadataTable);
