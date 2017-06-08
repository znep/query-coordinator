import React, { PropTypes } from 'react';
import ErrorPill from 'components/ErrorPill';
import { singularOrPlural } from '../../lib/util';
import styles from 'styles/Table/ErrorPointer.scss';

function ErrorPointer({ errorInfo, direction, scrollToColIdx }) {
  const className = direction === 'left'
    ? styles.errorPointerLeft
    : styles.errorPointerRight;
  const message = singularOrPlural(
    errorInfo.errorSum,
    I18n.show_output_schema.additional_errors.singular,
    I18n.show_output_schema.additional_errors.plural,
  );
  return (
    <span
      onClick={() => { scrollToColIdx(errorInfo.firstColWithErrors); }}
      className={className}>
      {direction === 'left' &&
        <span className="socrata-icon-arrow-left" />}
      <span className={styles.messageBody}>
        <ErrorPill number={errorInfo.errorSum} />
        {message}
      </span>
      {direction === 'right' &&
        <span className="socrata-icon-arrow-right" />}
    </span>
  );
}

ErrorPointer.propTypes = {
  errorInfo: PropTypes.shape({
    firstColWithErrors: PropTypes.number.isRequired,
    errorSum: PropTypes.number.isRequired
  }),
  direction: PropTypes.oneOf(['left', 'right']),
  scrollToColIdx: PropTypes.func.isRequired
};

export default ErrorPointer;
