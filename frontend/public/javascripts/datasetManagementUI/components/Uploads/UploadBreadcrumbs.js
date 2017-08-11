/* eslint react/jsx-indent: 0 */
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from 'links';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/Uploads/UploadBreadcrumbs.scss';

const UploadBreadcrumbs = ({ atShowUpload, sourceId, outputSchemaId, inputSchemaId, params }) =>
  <ol className={styles.list}>
    <li className={atShowUpload ? styles.active : null}>
      {atShowUpload
        ? I18n.home_pane.data
        : <Link to={Links.sources(params)}>
            {I18n.home_pane.data}
          </Link>}
      <SocrataIcon name="arrow-right" className={styles.icon} />
    </li>
    <li className={!atShowUpload ? styles.active : null}>
      {!atShowUpload || !sourceId || !inputSchemaId || !outputSchemaId
        ? I18n.home_pane.preview
        : <Link to={Links.showOutputSchema(params, sourceId, inputSchemaId, outputSchemaId)}>
            {I18n.home_pane.preview}
          </Link>}
    </li>
  </ol>;

UploadBreadcrumbs.propTypes = {
  atShowUpload: PropTypes.bool,
  sourceId: PropTypes.number,
  outputSchemaId: PropTypes.number,
  inputSchemaId: PropTypes.number,
  params: PropTypes.object.isRequired
};

export default UploadBreadcrumbs;
