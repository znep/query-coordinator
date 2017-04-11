import React, { PropTypes, PureComponent } from 'react';
import { components as SocrataVisualizations } from 'socrata-visualizations';
import { connect } from 'react-redux';

export class Table extends PureComponent {
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
