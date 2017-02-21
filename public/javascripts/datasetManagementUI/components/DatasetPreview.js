import React, { PropTypes, PureComponent } from 'react';
import { components as SocrataVisualizations } from 'socrata-visualizations';
import { connect } from 'react-redux';
import { columnsForOutputSchema } from '../selectors';

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

function mapStateToProps(state, { view, outputSchema }) {
  const [defaultSort] = columnsForOutputSchema(state.db, outputSchema.id);
  return {
    vif: {
      format: {
        type: 'visualization_interchange_format',
        version: 2
      },
      configuration: {
        viewSourceDataLink: false,
        order: [
          { ascending: true, columnName: defaultSort.field_name }
        ]
      },
      series: [
        {
          dataSource: {
            datasetUid: view.id,
            dimension: {},
            domain: window.location.host,
            type: 'socrata.soql',
            filters: []
          },
          type: 'table',
          unit: {
            one: 'item',
            other: 'items'
          }
        }
      ]
    }
  };
}

export default connect(mapStateToProps)(Table);
