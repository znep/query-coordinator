import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { EditBar } from 'common/components';
import SocrataIcon from 'common/components/SocrataIcon';
import * as ApplyRevision from '../actions/applyRevision';
import PublishButton from './PublishButton';
import styles from '../styles/AppBar.scss';
import { withRouter } from 'react-router';

const previewLink = (
  <div className={styles.primerPreview}>
    <a href={`/d/${window.initialState.view.id}`} target="_blank">
      Preview Primer
      <SocrataIcon name="preview" className={styles.previewIcon} />
    </a>
  </div>
);

export const AppBar = ({ name, showPreviewLink, revision }) =>
  <EditBar name={name}>
    {/* revision && // TODO: indicate what revision we're on; link back to revisionless page
      <div>
        &gt; Revision #{revision.revision_seq} <Link to={Links.home(params)}>(Back)</Link>
      </div>
    */}
    <div className={styles.buttonContainer}>
      {showPreviewLink && previewLink}
      {revision && <PublishButton />}
    </div>
  </EditBar>;

AppBar.propTypes = {
  name: PropTypes.string.isRequired,
  showPreviewLink: PropTypes.bool.isRequired,
  revision: PropTypes.object
};

function mapStateToProps({ entities }, { params }) {
  // only show the preview link when an upsert job has successfully completed
  const showPreviewLink = !!_.find(entities.task_sets, {
    status: ApplyRevision.TASK_SET_SUCCESSFUL
  });

  const revision = _.find(entities.revisions, { revision_seq: _.toNumber(params.revisionSeq) });

  return {
    name: _.values(entities.views)[0].name,
    showPreviewLink,
    revision
  };
}

export default withRouter(connect(mapStateToProps)(AppBar));
