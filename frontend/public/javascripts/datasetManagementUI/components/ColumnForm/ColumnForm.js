import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import Fieldset from 'components/Fieldset/Fieldset';
import ColumnField from 'containers/ColumnFieldContainer';
import styles from './ColumnForm.scss';

class ColumnForm extends Component {
  componentWillMount() {
    const { errors, setErrors } = this.props;
    setErrors(errors);
  }

  componentWillReceiveProps(nextProps) {
    const { errors: oldErrors } = this.props;
    const { errors: currentErrors, setErrors } = nextProps;

    if (!_.isEqual(oldErrors, currentErrors)) {
      setErrors(currentErrors);
    }
  }

  render() {
    const { rows } = this.props;

    return (
      <form>
        <Fieldset
          title={I18n.metadata_manage.column_tab.title}
          subtitle={I18n.metadata_manage.column_tab.subtitle}>
          {rows.map((row, idx) =>
            <div className={styles.row} key={idx}>
              {row.map(field => <ColumnField field={field} key={field.data.name} />)}
            </div>
          )}
        </Fieldset>
      </form>
    );
  }
}

ColumnForm.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
  errors: PropTypes.arrayOf(PropTypes.object).isRequired,
  setErrors: PropTypes.func.isRequired
};

export default ColumnForm;
