import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { createDSMAPIRevision } from '../actions/metadataTable';
import { MetadataTable as CommonMetadataTable } from 'common/components';
import { localizeLink } from 'common/locale';
import WatchDatasetButton from './WatchDatasetButton/WatchDatasetButton';
import { FeatureFlags } from 'common/feature_flags';

// TODO: This allows the tests to stay in the same place; remove it once the tests move to karma/common
export const MetadataTable = CommonMetadataTable;

const editThruDSMUI = FeatureFlags.value('enable_dsmui_edit_metadata') === true;
const isUSAID = FeatureFlags.value('usaid_features_enabled') === true;

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

  const editMetadataUrl = () => {
    if (isUSAID) {
      return `/publisher/edit?view=${coreView.id}`;
    } else if (editThruDSMUI) {
      return '#';
    } else {
      return view.editMetadataUrl;
    }
  };

  // EN-19924: USAID special feature. Only enable Associated Assets if the USAID feature flag is on,
  // and we are on a Primer page for a published table or blob
  const associatedAssetsAreEnabled = () => {
    const { viewType, displayType, publicationStage } = coreView;

    if (!isUSAID) return false;
    if (publicationStage !== 'published') return false;

    if (viewType === 'blobby') return true;
    if (viewType === 'tabular' && displayType === 'table') return true;

    /*
      11/20/17
      This is the case where the user is on a Primer page for an href child, updating its parent.
      We pushed back on USAID to implement this functionality farther down the line.
    */
    // if (viewType === 'href') return true;

    return false;
  };

  return ({
    enableAssociatedAssets: associatedAssetsAreEnabled(),
    localizeLink,
    coreView,
    customMetadataFieldsets,
    disableContactDatasetOwner: view.disableContactDatasetOwner,
    editMetadataUrl: editMetadataUrl(),
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

function mergeProps(stateProps, { dispatch }) {
  return {
    ...stateProps,
    onClickEditMetadata: e => {
      if (editThruDSMUI && !isUSAID) {
        e.preventDefault();
        dispatch(createDSMAPIRevision(stateProps.view.id));
      }

      const payload = {
        name: 'Edited Metadata',
        properties: {
          'From Page': 'DSLP'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },
    onClickStats: () => {
      const payload = {
        name: 'Viewed Dataset Statistics',
        properties: {
          'From Page': 'DSLP'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onExpandTags: () => {
      const payload = {
        name: 'Expanded Details',
        properties: {
          'Expanded Target': 'Tags'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onExpandMetadataTable: () => {
      const payload = {
        name: 'Expanded Details',
        properties: {
          'Expanded Target': 'Metadata Table'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onSaveAssociatedAssets: (associatedAssets) => {
      const associatedAssetIds = _.map(associatedAssets, (asset) => asset.id);
      console.log(associatedAssetIds);
      // TODO: make onSave action for this
    }
  };
}

export default connect(mapStateToProps, null, mergeProps)(CommonMetadataTable);
