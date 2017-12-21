import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styles from './ParseOptions.scss';
import TextInput from 'components/TextInput/TextInput';
import _ from 'lodash';

const SubI18n = I18n.parse_options;

class ParseOption extends Component {
  render() {
    const { placeholder, name, setOption, getOption, error } = this.props;

    let errorMessage = null;
    if (error) {
      errorMessage = <div className={styles.optionError}>{error.message}</div>;
    }

    return (
      <div>
        <label htmlFor={name}>{SubI18n[name]}</label>
        {errorMessage}
        <TextInput
          field={{
            placeholder: placeholder,
            id: name,
            name: name,
            value: _.toString(error ? error.value : getOption(name))
          }}
          handleChange={setOption}
          inErrorState={!!error} />
      </div>
    );
  }
}

ParseOption.propTypes = {
  placeholder: PropTypes.string,
  name: PropTypes.string.isRequired,
  setOption: PropTypes.func.isRequired,
  getOption: PropTypes.func.isRequired,
  error: PropTypes.object
};

export default ParseOption;
