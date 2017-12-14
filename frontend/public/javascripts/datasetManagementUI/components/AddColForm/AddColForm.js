import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import Fieldset from 'components/Fieldset/Fieldset';
import TextInput from 'components/TextInput/TextInput';
import TextArea from 'components/TextArea/TextArea';
import Select from 'components/Select/Select';
import SoqlTypePillBox from 'components/SoqlTypePillBox/SoqlTypePillBox';
import styles from './AddColForm.scss';
import { soqlProperties } from 'lib/soqlTypes';

export function makeFieldName(displayName = '') {
  // First 'replace' swaps all whitespace for '_'
  // Second 'replace' swaps all non-alphanumerics/non-underscores for '_'
  // The second replace could result in several consecutive underscores: e.g.
  // 'this is @ field name' -> 'this_is_@_field_name' -> 'this_is__field_name'.
  // So we run the third 'replace' to find consecutive underscores and replace them
  // with a single underscore.
  return displayName
    .replace(/\s/g, '_')
    .replace(/\W/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase();
}

export function makeTransformExpr(fieldName, transform, entities) {
  if (fieldName === 'null') {
    return transform(null);
  } else {
    return transform({ field_name: fieldName }, entities);
  }
}

const ErrorList = ({ errors = [] }) => {
  return (
    <ul className={styles.errorList}>
      {errors.map(error => (
        <li key={btoa(error)} className={styles.errorMessage}>
          {error}
        </li>
      ))}
    </ul>
  );
};

ErrorList.propTypes = {
  errors: PropTypes.array
};

const initialState = {
  displayName: '',
  description: '',
  transform: soqlProperties.text.conversions.text,
  fieldName: '',
  position: '',
  sourceColumnId: '',
  transformExpr: 'to_text(null)'
};

class AddColForm extends Component {
  constructor() {
    super();

    this.state = initialState;
    this.handleChange = this.handleChange.bind(this);
    this.handlePillClick = this.handlePillClick.bind(this);
  }

  componentWillReceiveProps(newProps) {
    // Kind of a hack for the submit button not being a child of the component
    // (which we could avoid if we moved it out of the modal footer >:{). The
    // button toggles a flag in the reduxstate, which resets the internal
    // state of this component
    if (newProps.clearInternalState) {
      this.setState(initialState);

      this.props.toggleClearInternalState();
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.displayName !== nextState.displayName) {
      this.setState({
        fieldName: makeFieldName(nextState.displayName)
      });
    }

    if (
      this.state.transform !== nextState.transform ||
      this.state.sourceColumnId !== nextState.sourceColumnId
    ) {
      const ic = this.props.inputColumns[nextState.sourceColumnId];

      let fieldName = 'null';

      if (ic) {
        fieldName = ic.field_name;
      }

      this.setState({
        transformExpr: makeTransformExpr(fieldName, nextState.transform, this.props.entities)
      });
    }

    if (!_.isEqual(nextState, this.state)) {
      this.props.syncToStore(nextState);
    }
  }

  componentWillUnmount() {
    this.props.hideFlash();
    this.props.resetFormErrors();
    this.props.syncToStore({});
  }

  handleChange(name) {
    return e => {
      this.props.markFormDirty();
      this.setState({
        [name]: e.target.value
      });
    };
  }

  handlePillClick(val) {
    this.setState({
      transform: val
    });
  }

  render() {
    const ic = this.props.inputColumns[this.state.sourceColumnId];
    const transforms = ic ? soqlProperties[ic.soql_type].conversions : soqlProperties.text.conversions;

    return (
      <form className={styles.form}>
        <Fieldset title={I18n.add_col.fieldset_title} subtitle={I18n.add_col.fieldset_subtitle}>
          <label htmlFor="displayName">{I18n.add_col.display_name}</label>
          <TextInput
            name="displayName"
            inErrorState={this.props.errors.displayName ? !!this.props.errors.displayName.length : false}
            value={this.state.displayName}
            handleChange={this.handleChange('displayName')} />
          <ErrorList errors={this.props.errors.displayName} />
          <label htmlFor="fieldName">{I18n.add_col.field_name}</label>
          <TextInput
            name="fieldName"
            value={this.state.fieldName}
            inErrorState={this.props.errors.fieldName ? !!this.props.errors.fieldName.length : false}
            handleChange={this.handleChange('fieldName')} />
          <ErrorList errors={this.props.errors.fieldName} />
          <label htmlFor="description">{I18n.add_col.description}</label>
          <TextArea
            name="description"
            inErrorState={false}
            value={this.state.description}
            handleChange={this.handleChange('description')} />
          <label htmlFor="sourceColumnId">{I18n.add_col.source_column}</label>
          <Select
            name="sourceColumnId"
            value={this.state.sourceColumnId}
            inErrorState={false}
            handleChange={this.handleChange('sourceColumnId')}
            options={this.props.selectOptions} />
          <SoqlTypePillBox
            transforms={transforms}
            currentTransform={this.state.transform}
            handleClick={this.handlePillClick} />
        </Fieldset>
      </form>
    );
  }
}

AddColForm.propTypes = {
  errors: PropTypes.object.isRequired,
  clearInternalState: PropTypes.bool.isRequired,
  resetFormErrors: PropTypes.func.isRequired,
  inputColumns: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired,
  selectOptions: PropTypes.array.isRequired,
  markFormDirty: PropTypes.func.isRequired,
  syncToStore: PropTypes.func.isRequired,
  toggleClearInternalState: PropTypes.func.isRequired,
  hideFlash: PropTypes.func.isRequired
};

export default AddColForm;
