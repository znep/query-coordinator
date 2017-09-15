/* eslint react/prop-types: 0 */
import PropTypes from 'prop-types';

import React from 'react';
import TransformStatus from 'components/TransformStatus/TransformStatus';
import TableBody from 'containers/TableBodyContainer';
import styles from './GeocodeShortcut.scss';
import columnHeaderStyles from 'components/ColumnHeader/ColumnHeader.scss';

const SubI18n = I18n.show_output_schema.geocode_shortcut;

const ColumnPreview = ({
  anySelected,
  isPreviewable,
  entities,
  path,
  inputSchema,
  outputColumn,
  displayState,
  onPreview,
  onClickError
}) => {
  let body;

  if (!anySelected) {
    body = (
      <div className={styles.noColumnYet}>
        <div className={styles.noOutputColumn}>
          <p className={styles.beginGeoreferencing}>
            {' '}{SubI18n.begin_georeferencing}{' '}
          </p>
        </div>
      </div>
    );
  } else if (!isPreviewable) {
    body = (
      <div className={styles.noColumnYet}>
        <button onClick={onPreview} className={styles.runTransform}>
          {SubI18n.preview}
        </button>
      </div>
    );
  } else {
    body = (
      <div>
        <div className={styles.columnPreview}>
          <table>
            <thead>
              <tr>
                <th>
                  <span className={columnHeaderStyles.colName} title={outputColumn.display_name}>
                    {outputColumn.display_name}
                  </span>
                </th>
                <TransformStatus
                  key={outputColumn.id}
                  path={path}
                  transform={outputColumn.transform}
                  isIgnored={false}
                  displayState={displayState}
                  columnId={outputColumn.id}
                  showShortcut={() => {}}
                  shortcuts={[]}
                  flyouts={false}
                  onClickError={onClickError}
                  totalRows={inputSchema.total_rows} />
              </tr>
            </thead>
            <TableBody
              entities={entities}
              columns={[outputColumn]}
              displayState={displayState}
              inputSchemaId={inputSchema.id} />
          </table>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.columnPreviewWrap}>
      <h6>Column Preview</h6>
      {body}
    </div>
  );
};

ColumnPreview.propTypes = {
  displayState: PropTypes.object.isRequired,
  inputSchema: PropTypes.object.isRequired,
  path: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired,
  onPreview: PropTypes.func.isRequired,
  onClickError: PropTypes.func.isRequired,
  outputcolumn: PropTypes.object,
  isPreviewable: PropTypes.bool.isRequired,
  anySelected: PropTypes.bool.isRequired
};

export default ColumnPreview;
