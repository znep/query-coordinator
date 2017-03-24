import _ from 'lodash';
import * as React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import './RowsPerPageSelector.scss';

export default class RowsPerPageSelector extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleOnChange']);
  }

  handleOnChange({ value }) {
    this.props.onChange(value);
  }

  render() {
    const { title, value, options } = this.props;
    const selectOptions = _.map(options, option => ({ label: option, value: option }));

    return <div className="rows-per-page-container">
      { title }:
      <Select
        options={ selectOptions }
        value={ value }
        clearable={ false }
        searchable={ false }
        onChange={ this.handleOnChange }
      />
    </div>;
  }
}

RowsPerPageSelector.propTypes = {
  title: React.PropTypes.string.isRequired,
  value: React.PropTypes.number.isRequired,
  onChange: React.PropTypes.func.isRequired,
  options: React.PropTypes.arrayOf(React.PropTypes.number).isRequired
};
