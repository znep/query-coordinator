import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import * as Links from 'links';
import _ from 'lodash';
import { Link, browserHistory, withRouter } from 'react-router';
import { createSource } from 'reduxStuff/actions/showView';
import CommonSchemaPreview from '../../common/components/SchemaPreview';
import styles from 'styles/SchemaPreview.scss';

const mapStateToProps = ({ entities }, { params }) => ({
  onExpandColumn: _.noop,
  onExpandSchemaTable: _.noop,
  columns: entities.views[params.fourfour].columns
});

const mergeProps = (stateProps, { dispatch }, { params }) => {
  const clickHandler = e => {
    e.preventDefault();

    dispatch(createSource(params));

    // dispatch(createRevisionThenSource(params)).then(({ resource, params: newParams }) => {
    //   const osid = resource.schemas[0].output_schemas[0].id;
    //   browserHistory.push(Links.columnMetadataForm(newParams, osid));
    // });
  };

  return {
    ...stateProps,
    headerButton: (
      <Link className={styles.btnWrapper} onClick={clickHandler}>
        <button className={styles.schemaBtn} tabIndex="-1">
          {I18n.home_pane.column_metadata_manage_button}
        </button>
      </Link>
    )
  };
};

export default withRouter(connect(mapStateToProps, null, mergeProps)(CommonSchemaPreview));
