import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './FatalError.module.scss';

const SubI18n = I18n.show_output_schema.fatal_error;


const FatalError = props => {
  const { source, outputSchema, outputColumns } = props;

  if (!outputSchema) {
    return null;
  }

  let message = SubI18n.unknown_error;
  let details = '';
  let requestId = '';

  const failedColumn = _.find(outputColumns, c => c.transform.failed_at);

  if (source.failed_at) {
    message = SubI18n.source_error;
    const failure = source.failure_details;

    if (failure) {
      details = failure.message;
      requestId = failure.request_id;
    }
  } else if (failedColumn) {
    message = SubI18n.transform_error;
    details = failedColumn.transform.transform_expr;
  }

  return (
    <div className={styles.fatalError}>
      <SocrataIcon name="failed" />
      <span className={styles.errorMessage}>{message}</span>
      <span className={styles.errorDetails} title={requestId}>{details}</span>
    </div>
  );
};

FatalError.propTypes = {
  source: PropTypes.object.isRequired,
  outputSchema: PropTypes.object,
  outputColumns: PropTypes.array.isRequired
};

export default FatalError;
