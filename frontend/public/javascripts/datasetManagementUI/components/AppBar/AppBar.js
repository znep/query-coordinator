import React, { PropTypes } from 'react';
import { EditBar } from 'common/components';
import SocrataIcon from 'common/components/SocrataIcon';
import PublishButton from 'containers/PublishButtonContainer';
import styles from './AppBar.scss';

const PreviewLink = () =>
  <div className={styles.primerPreview}>
    <a href={`/d/${window.initialState.view.id}`} target="_blank">
      Preview Primer
      <SocrataIcon name="preview" className={styles.previewIcon} />
    </a>
  </div>;

export const AppBar = ({ name, showPreviewLink, revision }) =>
  <EditBar name={name}>
    {/* revision && // TODO: indicate what revision we're on; link back to revisionless page
    <div>
      &gt; Revision #{revision.revision_seq} <Link to={Links.home(params)}>(Back)</Link>
    </div>
  */}
    <div className={styles.buttonContainer}>
      {showPreviewLink && <PreviewLink />}
      {revision && <PublishButton />}
    </div>
  </EditBar>;

AppBar.propTypes = {
  name: PropTypes.string.isRequired,
  showPreviewLink: PropTypes.bool.isRequired,
  revision: PropTypes.object
};

export default AppBar;
