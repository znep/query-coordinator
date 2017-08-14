import React, { PropTypes } from 'react';
import { EditBar } from 'common/components';
import SocrataIcon from 'common/components/SocrataIcon';
import PublishButton from './PublishButton';
import styles from '../styles/AppBar.scss';

const PreviewLink = () =>
  <div className={styles.primerPreview}>
    <a href={`/d/${window.initialState.view.id}`} target="_blank">
      Preview Primer
      <SocrataIcon name="preview" className={styles.previewIcon} />
    </a>
  </div>;

export const AppBar = ({ name, showPreviewLink }) =>
  <EditBar name={name}>
    <div className={styles.buttonContainer}>
      {showPreviewLink && <PreviewLink />}
      <PublishButton />
    </div>
  </EditBar>;

AppBar.propTypes = {
  name: PropTypes.string.isRequired,
  showPreviewLink: PropTypes.bool.isRequired
};

export default AppBar;
