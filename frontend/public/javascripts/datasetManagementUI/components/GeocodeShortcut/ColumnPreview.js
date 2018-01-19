/* eslint react/prop-types: 0 */
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';
import React from 'react';
import TransformStatus from 'datasetManagementUI/components/TransformStatus/TransformStatus';
import TableBody from 'datasetManagementUI/containers/TableBodyContainer';
import styles from './GeocodeShortcut.module.scss';
import columnHeaderStyles from 'datasetManagementUI/components/ColumnHeader/ColumnHeader.module.scss';
import * as DisplayState from 'datasetManagementUI/lib/displayState';
import * as Links from '../../links/links';

const SubI18n = I18n.show_output_schema.geocode_shortcut;

const ColumnPreview = ({
  outputSchema,
  anySelected,
  isPreviewable,
  entities,
  params,
  inputSchema,
  outputColumn,
  displayState,
  onPreview
}) => {
  let body;
  const onClickError = () => {
    const linkPath = DisplayState.inErrorMode(displayState, outputColumn.transform)
      ? Links.geocodeShortcut(params)
      : Links.geocodeShortcutErrors(params, outputColumn.transform.id);

    browserHistory.push(linkPath);
  };

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
          {SubI18n.run_geocoding}
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
                  outputSchema={outputSchema}
                  key={outputColumn.id}
                  params={params}
                  transform={outputColumn.transform}
                  isIgnored={false}
                  displayState={displayState}
                  columnId={outputColumn.id}
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
  outputSchema: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired,
  onPreview: PropTypes.func.isRequired,
  outputcolumn: PropTypes.object,
  isPreviewable: PropTypes.bool.isRequired,
  anySelected: PropTypes.bool.isRequired
};

export default ColumnPreview;
