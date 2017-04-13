import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { EditBar } from 'socrata-components';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from '../styles/AppBar.scss';
import * as ApplyUpdate from '../actions/applyUpdate';

const PreviewLink = () =>
  <div className={styles.primerPreview}>
    <a
      href={`/d/${window.initialState.view.id}`}
      target="_blank">
      Preview Primer
      <SocrataIcon name="preview" className={styles.previewIcon} />
    </a>
  </div>;

const AppBar = ({ name, showPreviewLink }) =>
  <EditBar name={name} >
    {showPreviewLink && <PreviewLink />}
  </EditBar>;

AppBar.propTypes = {
  name: PropTypes.string.isRequired,
  showPreviewLink: PropTypes.bool.isRequired
};

function mapStateToProps(state) {
  // only show the preview link when an upsert job has successfully completed
  const showPreviewLink = !!_.find(state.db.upsert_jobs, {
    status: ApplyUpdate.UPSERT_JOB_SUCCESSFUL
  });

  return {
    name: _.values(state.db.views)[0].name,
    showPreviewLink
  };
}

export default connect(mapStateToProps)(AppBar);