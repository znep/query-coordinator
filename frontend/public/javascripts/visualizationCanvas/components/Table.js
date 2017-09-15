import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { components as SocrataVisualizations } from 'common/visualizations';
import { connect } from 'react-redux';

export class Table extends Component {
  // if the VIF has not changed between renders, don't re-render!
  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps.vif, this.props.vif);
  }

  render() {
    const { vif } = this.props;

    return (
      <div className="table-contents">
        <SocrataVisualizations.Visualization vif={vif} />
      </div>
    );
  }
}

Table.propTypes = {
  vif: PropTypes.object.isRequired
};

function mapStateToProps({ parentView, filters }) {
  return {
    vif: {
      format: {
        type: 'visualization_interchange_format',
        version: 2
      },
      configuration: {
        viewSourceDataLink: false
      },
      series: [
        {
          dataSource: {
            datasetUid: parentView.id,
            dimension: {},
            domain: window.serverConfig.domain,
            type: 'socrata.soql',
            filters
          },
          type: 'table',
          unit: parentView.rowLabel
        }
      ]
    }
  };
}

export default connect(mapStateToProps)(Table);
