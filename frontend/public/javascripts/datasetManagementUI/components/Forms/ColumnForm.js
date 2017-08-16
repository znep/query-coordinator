import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import Fieldset from 'components/FormComponents/Fieldset';
import { makeRows, validateColumnForm } from 'models/forms';
import ColumnField from 'components/FormComponents/ColumnField';
import { setFormErrors } from 'actions/forms';
import styles from 'styles/Forms/ColumnForm.scss';

export class ColumnForm extends Component {
  componentWillMount() {
    const { errors } = this.props;
    setFormErrors('columnFormn', errors);
  }

  componentWillReceiveProps(nextProps) {
    const { errors: oldErrors } = this.props;
    const { errors: currentErrors, dispatch } = nextProps;

    if (!_.isEqual(oldErrors, currentErrors)) {
      dispatch(setFormErrors('columnFormn', currentErrors));
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
  outputSchemaId: PropTypes.number.isRequired
};

const mapStateToProps = ({ entities, ui }, { outputSchemaId }) => ({
  rows: makeRows(outputSchemaId, entities),
  errors: validateColumnForm(outputSchemaId, entities),
  outputSchemaId
});

export default connect(mapStateToProps)(ColumnForm);
