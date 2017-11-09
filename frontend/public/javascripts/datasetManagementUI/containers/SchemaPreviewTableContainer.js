import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as Selectors from 'selectors';
import _ from 'lodash';
import SchemaPreviewTable from 'components/SchemaPreviewTable/SchemaPreviewTable';
import { snakeCase } from 'reduxStuff/actions/showOutputSchema';
import { conversionsToCanonicalName } from 'lib/soqlTypes';

const mapStateToProps = ({ entities, ui }, { params }) => {
  const cols = Selectors.columnsForOutputSchema(entities, _.toNumber(params.outputSchemaId));

  const addColFormState = ui.forms.addColForm.state;

  const newColType = addColFormState.transformExpr ? addColFormState.transformExpr.split('(').shift() : '';

  const newCol = {
    ...snakeCase(addColFormState),
    newCol: true,
    transform: {
      output_soql_type: conversionsToCanonicalName(newColType)
    }
  };

  if (newCol.field_name || newCol.display_name) {
    return { outputColumns: [newCol, ...cols] };
  }

  return { outputColumns: cols };
};

export default withRouter(connect(mapStateToProps)(SchemaPreviewTable));
