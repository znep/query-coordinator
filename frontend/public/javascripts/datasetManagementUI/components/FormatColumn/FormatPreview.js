import PropTypes from 'prop-types';
import React from 'react';
import TableBody from 'containers/TableBodyContainer';
import * as DisplayState from 'lib/displayState';
import styles from './FormatColumn.scss';
const SubI18n = I18n.format_column;

const FormatPreview = ({
  outputColumn,
  format,
  inputSchema,
  outputSchema,
  entities
}) => {
  // This just constructs a default display state on page 1
  const displayState = DisplayState.normal(1, outputSchema.id);
  return (
    <div className={styles.formatPreviewWrap}>
      <h6>{SubI18n.formatting_preview}</h6>
      <div className={styles.formatPreview}>
        <div>
          <table>
            <TableBody
              entities={entities}
              columns={[{ ...outputColumn, format }]}
              displayState={displayState}
              inputSchemaId={inputSchema.id} />
          </table>
        </div>
      </div>
    </div>
  );
};

FormatPreview.propTypes = {
  entities: PropTypes.object.isRequired,
  outputColumn: PropTypes.object.isRequired,
  format: PropTypes.object.isRequired,
  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired
};

export default FormatPreview;
