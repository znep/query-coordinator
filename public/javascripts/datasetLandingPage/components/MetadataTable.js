import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import CommonMetadataTable from '../../common/components/MetadataTable';

// TODO: This allows the tests to stay in the same place; remove it once the tests move to karma/common
export const MetadataTable = CommonMetadataTable;

function mapStateToProps(state) {
  return _.pick(state, 'view');
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
