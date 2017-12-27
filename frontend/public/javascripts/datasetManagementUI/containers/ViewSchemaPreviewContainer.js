import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import * as Links from 'links/links';
import _ from 'lodash';
import { Link, browserHistory, withRouter } from 'react-router';
import { createViewSource } from 'reduxStuff/actions/createSource';
import { getRevision } from 'reduxStuff/actions/loadRevision';
import CommonSchemaPreview from '../../common/components/SchemaPreview';
import styles from 'styles/SchemaPreview.module.scss';

const mapStateToProps = ({ entities }, { params }) => ({
  onExpandColumn: _.noop,
  onExpandSchemaTable: _.noop,
  columns: entities.views[params.fourfour].columns
});

const mergeProps = (stateProps, { dispatch }, { params }) => {
  const clickHandler = e => {
    e.preventDefault();

    dispatch(createViewSource(params))
      .then(source => {
        const osid = Math.max(...Object.keys(source.outputSchemas));
        browserHistory.push(Links.columnMetadataForm(params, osid));
        return source;
      })
      .then(() => {
        dispatch(getRevision(params));
      });
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
