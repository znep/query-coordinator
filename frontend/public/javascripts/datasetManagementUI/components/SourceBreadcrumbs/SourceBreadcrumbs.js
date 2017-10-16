/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';

import React from 'react';
import { Link } from 'react-router';
import * as Links from 'links/links';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './SourceBreadcrumbs.scss';

const SourceBreadcrumbs = ({ atShowSource, sourceId, outputSchemaId, inputSchemaId, params }) => {
  const canShowPreviewPage = sourceId != null && outputSchemaId != null && inputSchemaId != null;

  return (
    <ol className={styles.list}>
      <li className={atShowSource ? styles.active : null}>
        {atShowSource ? I18n.home_pane.data : <Link to={Links.sources(params)}>{I18n.home_pane.data}</Link>}
        {canShowPreviewPage && <SocrataIcon name="arrow-right" className={styles.icon} />}
      </li>
      {canShowPreviewPage && (
        <li className={!atShowSource ? styles.active : null}>
          {!atShowSource ? (
            I18n.home_pane.preview
          ) : (
            <Link to={Links.showOutputSchema(params, sourceId, inputSchemaId, outputSchemaId)}>
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
  sourceId: PropTypes.number,
  outputSchemaId: PropTypes.number,
  inputSchemaId: PropTypes.number,
  params: PropTypes.object.isRequired
};

export default SourceBreadcrumbs;
