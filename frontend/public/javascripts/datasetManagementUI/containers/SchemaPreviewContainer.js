import PropTypes from 'prop-types'; // eslint-disable-line no-unused-vars
import React from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router';
import * as Links from 'links';
import * as Selectors from 'selectors';
import CommonSchemaPreview from '../../common/components/SchemaPreview';
import styles from 'styles/SchemaPreview.scss';

function mapStateToProps({ entities }, { params }) {
  const revisionSeq = _.toNumber(params.revisionSeq);
  const currentOutputSchema = Selectors.currentOutputSchema(entities, revisionSeq);

  if (currentOutputSchema) {
    const columns = Selectors.columnsForOutputSchema(entities, currentOutputSchema.id).map(column => {
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
        <Link className={styles.btnWrapper} to={Links.columnMetadataForm(params, currentOutputSchema.id)}>
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
