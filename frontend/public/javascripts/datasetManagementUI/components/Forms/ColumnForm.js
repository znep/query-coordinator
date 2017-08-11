import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import Fieldset from 'components/FormComponents/Fieldset';
import ColumnField from 'components/FormComponents/ColumnFieldContainer';
import styles from 'styles/Forms/ColumnForm.scss';

class ColumnForm extends Component {
  componentWillMount() {
    const { setErrors } = this.props;
    setErrors();
  }

  componentWillReceiveProps(nextProps) {
    const { errors: oldErrors } = this.props;
    const { setErrors, errors: currentErrors } = nextProps;

    if (!_.isEqual(oldErrors, currentErrors)) {
      setErrors();
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
  setErrors: PropTypes.func.isRequired,
  outputSchemaId: PropTypes.number.isRequired
};

export default ColumnForm;
