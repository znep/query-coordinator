import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { EditBar } from 'common/components';
import SocrataIcon from 'common/components/SocrataIcon';
import * as ApplyRevision from '../actions/applyRevision';
import PublishButton from './PublishButton';
import styles from '../styles/AppBar.scss';

const previewLink = (
  <div className={styles.primerPreview}>
    <a href={`/d/${window.initialState.view.id}`} target="_blank">
      Preview Primer
      <SocrataIcon name="preview" className={styles.previewIcon} />
    </a>
  </div>
);

export const AppBar = ({ name, showPreviewLink }) =>
  <EditBar name={name}>
    <div className={styles.buttonContainer}>
      {showPreviewLink && previewLink}
      <PublishButton />
    </div>
  </EditBar>;

AppBar.propTypes = {
  name: PropTypes.string.isRequired,
  showPreviewLink: PropTypes.bool.isRequired
};

function mapStateToProps({ entities }) {
  // only show the preview link when an upsert job has successfully completed
  const showPreviewLink = !!_.find(entities.task_sets, {
    status: ApplyRevision.TASK_SET_SUCCESSFUL
  });

  return {
    name: _.values(entities.views)[0].name,
    showPreviewLink
  };
}

export default connect(mapStateToProps)(AppBar);
