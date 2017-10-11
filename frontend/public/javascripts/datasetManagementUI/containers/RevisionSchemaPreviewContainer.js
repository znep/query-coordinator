import React from 'react'; // eslint-disable-line no-unused-vars
import _ from 'lodash';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router';
import * as Links from 'links/links';
import * as Selectors from 'selectors';
import CommonSchemaPreview from '../../common/components/SchemaPreview';
import styles from 'styles/SchemaPreview.scss';

const calcColumns = (entities, os) => {
  if (os) {
    return Selectors.columnsForOutputSchema(entities, os.id).map(column => {
      const transform = entities.transforms[column.transform_id];
      return {
        dataTypeName: transform && transform.output_soql_type,
        description: column.description,
        fieldName: column.field_name,
        name: column.display_name
      };
    });
  } else {
    return [];
  }
};

const makeHeaderButton = (params, os) => {
  if (os) {
    return (
      <Link className={styles.btnWrapper} to={Links.columnMetadataForm(params, os.id)}>
        <button className={styles.schemaBtn} tabIndex="-1">
          {I18n.home_pane.column_metadata_manage_button}
        </button>
      </Link>
    );
  } else {
    return null;
  }
};

const mapStateToProps = ({ entities }, { params }) => {
  const revisionSeq = _.toNumber(params.revisionSeq);
  const currentOutputSchema = Selectors.currentOutputSchema(entities, revisionSeq);

  return {
    columns: calcColumns(entities, currentOutputSchema),
    headerButton: makeHeaderButton(params, currentOutputSchema),
    onExpandColumn: _.noop,
    onExpandSchemaTable: _.noop
  };
};

export default withRouter(connect(mapStateToProps)(CommonSchemaPreview));
