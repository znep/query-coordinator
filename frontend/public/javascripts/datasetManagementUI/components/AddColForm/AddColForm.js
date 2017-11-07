import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import Fieldset from 'components/Fieldset/Fieldset';
import TextInput from 'components/TextInput/TextInput';
import TextArea from 'components/TextArea/TextArea';
import Select from 'components/Select/Select';
import styles from './AddColForm.scss';

function makeFieldName(displayName) {
  // First replace swaps all whitespace for '_'
  // Second removes all non-alphanumerics/non-underscores
  // The second replace could result in several consecutive underscores: e.g.
  // 'this is @ field name' -> 'this_is_@_field_name' -> 'this_is__field_name'.
  // So we run the third replace to find consecutive underscores and replace them
  // with a single underscore.
  return displayName
    .replace(/\s/g, '_')
    .replace(/\W/g, '_')
    .replace(/__+/g, '_');
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

class AddColForm extends Component {
  constructor() {
    super();

    this.state = {
      displayName: '',
      description: '',
      transform: '',
      fieldName: '',
      position: ''
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.displayName !== nextState.displayName) {
      this.setState({
        fieldName: makeFieldName(nextState.displayName)
      });
    }

    if (!_.isEqual(nextState, this.state)) {
      this.props.syncToStore(nextState);
    }
  }

  handleChange(name) {
    return e => {
      this.props.markFormDirty();
      this.setState({
        [name]: e.target.value
      });
    };
  }

  render() {
    return (
      <form className={styles.form}>
        <Fieldset title="Add Column" subtitle="Add a column to your schema">
          <label htmlFor="displayName">Display Name</label>
          <TextInput
            name="displayName"
            inErrorState={this.props.errors.displayName ? !!this.props.errors.displayName.length : false}
            value={this.state.displayName}
            handleChange={this.handleChange('displayName')} />
          <ErrorList errors={this.props.errors.displayName} />
          <label htmlFor="fieldName">Field Name</label>
          <TextInput
            name="fieldName"
            value={this.state.fieldName}
            inErrorState={this.props.errors.fieldName ? !!this.props.errors.fieldName.length : false}
            handleChange={this.handleChange('fieldName')} />
          <ErrorList errors={this.props.errors.fieldName} />
          <label htmlFor="description">Description</label>
          <TextArea
            name="description"
            inErrorState={false}
            value={this.state.description}
            handleChange={this.handleChange('description')} />
          <label htmlFor="transform">Type</label>
          <Select
            name="transform"
            value={this.state.transform}
            inErrorState={false}
            handleChange={this.handleChange('transform')}
            options={[{ value: 1, title: 'first' }, { value: 2, title: 'second' }]} />
        </Fieldset>
      </form>
    );
  }
}

AddColForm.propTypes = {
  errors: PropTypes.object.isRequired,
  markFormDirty: PropTypes.func.isRequired,
  syncToStore: PropTypes.func.isRequired
};

export default AddColForm;
