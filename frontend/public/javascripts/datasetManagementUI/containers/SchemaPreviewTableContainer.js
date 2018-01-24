import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as Selectors from 'datasetManagementUI/selectors';
import _ from 'lodash';
import SchemaPreviewTable from 'datasetManagementUI/components/SchemaPreviewTable/SchemaPreviewTable';
import { snakeCase } from 'datasetManagementUI/reduxStuff/actions/showOutputSchema';
import { conversionsToCanonicalName, soqlProperties } from 'datasetManagementUI/lib/soqlTypes';

const mapStateToProps = ({ entities, ui }, { params }) => {
  const cols = Selectors.columnsForOutputSchema(entities, _.toNumber(params.outputSchemaId)).map(col => ({
    ...col,
    iconName: soqlProperties[col.transform.output_soql_type].icon
  }));

  const addColFormState = ui.forms.addColForm.state;

  const newColType = addColFormState.transformExpr ? addColFormState.transformExpr.split('(').shift() : '';

  const cannonicalName = conversionsToCanonicalName(newColType);

  const newCol = {
    ...snakeCase(addColFormState),
    newCol: true,
    transform: {
      output_soql_type: cannonicalName
    },
    iconName: soqlProperties[cannonicalName].icon
  };

  if (newCol.field_name || newCol.display_name) {
    return { outputColumns: [newCol, ...cols] };
  }

  return { outputColumns: cols };
};

export default withRouter(connect(mapStateToProps)(SchemaPreviewTable));
