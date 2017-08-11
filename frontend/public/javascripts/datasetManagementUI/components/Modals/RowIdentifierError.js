import React, { PropTypes } from 'react';
import { ModalContent, ModalFooter } from 'common/components';
import styles from 'styles/Modals/RowIdentifierError.scss';

const REASON_DUPLICATE = 'duplicate';
const REASON_NULL = 'null';
const REASON_BAD_TYPE = 'bad type';

const SubI18n = I18n.show_output_schema.row_identifier_error;

function errorMessage(result) {
  switch (result.reason) {
    case REASON_DUPLICATE:
      return SubI18n.reason_duplicate.format({ value: result.what, first_index: result.where });

    case REASON_NULL:
      return SubI18n.reason_null.format({ row_index: result.where });

    case REASON_BAD_TYPE:
      return SubI18n.reason_bad_type;

    default:
      return null;
  }
}

function RowIdentifierError({ result, doCancel }) {
  return (
    <div>
      <h2>Error setting row identifier</h2>
      <ModalContent>
        <p>
          {errorMessage(result)}
        </p>
        <p>
          {SubI18n.what_to_do}
        </p>
      </ModalContent>
      <ModalFooter>
        <button onClick={doCancel} className={styles.cancelButton}>
          {I18n.common.ok}
        </button>
      </ModalFooter>
    </div>
  );
}

RowIdentifierError.propTypes = {
  result: PropTypes.shape({
    what: PropTypes.string.isRequired,
    where: PropTypes.number.isRequired,
    valid: PropTypes.bool.isRequired,
    reason: PropTypes.oneOf([REASON_DUPLICATE, REASON_NULL, REASON_BAD_TYPE]).isRequired
  }).isRequired,
  doCancel: PropTypes.func.isRequired
};

export default RowIdentifierError;
