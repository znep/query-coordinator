import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import CommonSchemaPreview from '../../common/components/SchemaPreview';

// TODO: This allows the tests to stay in the same place; remove it once the tests move to karma/common
export const SchemaPreview = CommonSchemaPreview;

function mapStateToProps(state) {
  return {
    columns: state.view.columns
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onExpandColumn(event) {
      const row = $(event.target).closest('.column-summary');

      const payload = {
        name: 'Expanded Column Info',
        properties: {
          'Name': row.find('.column-name').text().trim(),
          'Type': _.upperFirst(row.find('.type-name').data('name'))
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onExpandSchemaTable() {
      const payload = {
        name: 'Expanded Details',
        properties: {
          'Expanded Target': 'Schema Preview Table'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CommonSchemaPreview);
