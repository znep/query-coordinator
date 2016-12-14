import React, { PropTypes } from 'react';
import { components } from 'socrata-visualizations';
import { connect } from 'react-redux';

export const Table = ({ vif }) => (
  <div className="table-contents">
    <components.Visualization vif={vif} />
  </div>
);

Table.propTypes = {
  vif: PropTypes.object.isRequired
};

function mapStateToProps({ parentView }) {
  return {
    vif: {
      format: {
        type: 'visualization_interchange_format',
        version: 2
      },
      configuration: {
        order: parentView.sortOrder,
        viewSourceDataLink: false
      },
      series: [
        {
          dataSource: {
            datasetUid: parentView.id,
            dimension: {},
            domain: window.serverConfig.domain,
            type: 'socrata.soql',
            filters: []
          },
          type: 'table',
          unit: parentView.rowLabel
        }
      ]
    }
  };
}

export default connect(mapStateToProps)(Table);