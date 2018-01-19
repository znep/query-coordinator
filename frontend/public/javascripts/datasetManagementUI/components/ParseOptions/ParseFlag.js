import PropTypes from 'prop-types';
import React, { Component } from 'react';
import CheckBox from 'datasetManagementUI/components/CheckBox/CheckBox';

const SubI18n = I18n.parse_options;

class ParseFlag extends Component {
  render() {
    const { name, setOption, getOption } = this.props;

    return (
      <div>
        <label htmlFor={name}>
          {SubI18n[name]}
        </label>
        <CheckBox
          id={name}
          name={name}
          value={getOption(name)}
          handleClick={setOption} />
      </div>
    );
  }
}

ParseFlag.propTypes = {
  name: PropTypes.string.isRequired,
  setOption: PropTypes.func.isRequired,
  getOption: PropTypes.func.isRequired
};

export default ParseFlag;
