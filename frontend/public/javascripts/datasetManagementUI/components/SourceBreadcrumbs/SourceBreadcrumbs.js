/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';

import React from 'react';
import { Link } from 'react-router';
import * as Links from 'links/links';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './SourceBreadcrumbs.scss';

function getPreviewLink(params, blobId, sourceId, inputSchemaId, outputSchemaId) {
  if (blobId) {
    return Links.showBlobPreview(params, blobId);
  } else if (sourceId && inputSchemaId && outputSchemaId) {
    return Links.showOutputSchema(params, sourceId, inputSchemaId, outputSchemaId);
  } else {
    return null;
  }
}

const SourceBreadcrumbs = ({ atShowSource, blobId, sourceId, outputSchemaId, inputSchemaId, params }) => {
  const canShowSchemaPreviewPage = sourceId != null && outputSchemaId != null && inputSchemaId != null;
  const canShowBlobPreviewPage = blobId != null;
  const canPreview = canShowSchemaPreviewPage || canShowBlobPreviewPage;

  return (
    <ol className={styles.list}>
      <li className={atShowSource ? styles.active : null}>
        {atShowSource ? I18n.home_pane.data : <Link to={Links.sources(params)}>{I18n.home_pane.data}</Link>}
        {canPreview && <SocrataIcon name="arrow-right" className={styles.icon} />}
      </li>
      {canPreview && (
        <li className={!atShowSource ? styles.active : null}>
          {!atShowSource ? (
            I18n.home_pane.preview
          ) : (
            <Link to={getPreviewLink(params, blobId, sourceId, inputSchemaId, outputSchemaId)}>
              {I18n.home_pane.preview}
            </Link>
          )}
        </li>
      )}
    </ol>
  );
};

SourceBreadcrumbs.propTypes = {
  atShowSource: PropTypes.bool,
  blobId: PropTypes.number,
  sourceId: PropTypes.number,
  outputSchemaId: PropTypes.number,
  inputSchemaId: PropTypes.number,
  params: PropTypes.object.isRequired
};

export default SourceBreadcrumbs;
