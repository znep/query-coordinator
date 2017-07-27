import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import _ from 'lodash';
import Fieldset from 'components/FormComponents/Fieldset';
import { editView } from 'actions/views';
import { makeRows, validateColumnForm } from 'models/forms';
import ColumnField from 'components/FormComponents/ColumnField';
import styles from 'styles/Forms/ColumnForm.scss';

export class ColumnForm extends Component {
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
              {row.map(field => <ColumnField field={field} key={field.name} />)}
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

const mapStateToProps = ({ entities, ui }, { outputSchemaId }) => {
  return {
    rows: makeRows(outputSchemaId, entities),
    errors: validateColumnForm(outputSchemaId, entities),
    outputSchemaId
  };
};

const mergeProps = ({ fourfour, outputSchemaId, errors, rows }, { dispatch }, { params }) => ({
  errors,
  rows,
  outputSchemaId,
  setErrors: () => dispatch(editView(params.fourfour, { columnMetadataErrors: errors }))
});

export default withRouter(connect(mapStateToProps, null, mergeProps)(ColumnForm));
