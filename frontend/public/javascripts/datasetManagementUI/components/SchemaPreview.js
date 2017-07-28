import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router';
import * as Links from '../links';
import CommonSchemaPreview from '../../common/components/SchemaPreview';
import { columnsForOutputSchema } from '../selectors';
import _ from 'lodash';
import styles from 'styles/SchemaPreview.scss';

function mapStateToProps({ entities }, { params }) {
  // TODO: how do we know which is the correct input schema to show?
  // how do we know which is the correct output schema to show?

  // TODO: this is awfully slow because the DB is arrays not keyed by id
  const latestOutputSchema = _.reduce(
    entities.output_schemas || [],
    (acc, os) => {
      if (!acc) return os;
      if (os.id > acc.id) return os;
      return acc;
    },
    null
  );

  if (latestOutputSchema) {
    const columns = columnsForOutputSchema(entities, latestOutputSchema.id).map(column => {
      const transform = entities.transforms[column.transform_id];
      return {
        dataTypeName: transform && transform.output_soql_type,
        description: column.description,
        fieldName: column.field_name,
        name: column.display_name
      };
    });

    return {
      columns,
      headerButton: (
        <Link className={styles.btnWrapper} to={Links.columnMetadataForm(params, latestOutputSchema.id)}>
          <button className={styles.schemaBtn} tabIndex="-1">
            {I18n.home_pane.column_metadata_manage_button}
          </button>
        </Link>
      )
    };
  }

  return {
    columns: []
  };
}

function mapDispatchToProps() {
  return {
    onExpandColumn() {},
    onExpandSchemaTable() {}
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CommonSchemaPreview));
