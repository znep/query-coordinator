import { connect } from 'react-redux';
import { columnsForOutputSchema } from 'selectors';
import DatasetPreview from 'components/DatasetPreview/DatasetPreview';

function mapStateToProps({ entities }, { view, outputSchema }) {
  const [defaultSort] = columnsForOutputSchema(entities, outputSchema.id);

  return {
    vif: {
      format: {
        type: 'visualization_interchange_format',
        version: 2
      },
      configuration: {
        viewSourceDataLink: false,
        order: [{ ascending: true, columnName: defaultSort.field_name }]
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
            one: 'Row',
            other: 'Rows'
          }
        }
      ]
    }
  };
}

export default connect(mapStateToProps)(DatasetPreview);
