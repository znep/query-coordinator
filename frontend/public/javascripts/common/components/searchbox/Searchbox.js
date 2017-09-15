import PropTypes from 'prop-types';
import React from 'react';
import { handleEnter } from '../../helpers/keyPressHelpers';

export class Searchbox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      query: this.props.defaultQuery
    };

    _.bindAll(this, ['clearQuery', 'handleChange', 'handleSearch']);
  }

  componentDidMount() {
    if (this.props.autoFocus) {
      this.searchInput.focus();
    }
  }

  componentDidUpdate() {
    if (this.props.autoFocus) {
      this.searchInput.focus();
    }
  }

  clearQuery(event) {
    event.preventDefault();
    this.setState({ query: '' }, this.props.onClear(this.state.query));
  }

  handleChange(query) {
    this.props.onChange(query);
    this.setState({ query });
  }

  handleSearch(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.onSearch(event.target.value);
  }

  render() {
    const { placeholder } = this.props;
    const { query } = this.state;

    const clearSearchButton = (query ?
      <button
        aria-label={_.get(I18n, 'common.searchbox.clear')}
        className="clear-search socrata-icon-close-2"
        onClick={this.clearQuery}
        title={_.get(I18n, 'common.searchbox.clear')} /> : null
    );

    const inputProps = {
      'aria-label': placeholder,
      className: 'text-input',
      onChange: (event) => this.handleChange(event.target.value),
      onKeyDown: handleEnter(this.handleSearch),
      placeholder,
      ref: (input) => { this.searchInput = input; },
      type: 'text',
      value: query
    };

    return (
      <div className="searchbox common-searchbox">
        <span className="socrata-icon-search"></span>
        <input {...inputProps} />
        {clearSearchButton}
      </div>
    );
  }
}

Searchbox.propTypes = {
  autoFocus: PropTypes.bool,
  defaultQuery: PropTypes.string,
  onChange: PropTypes.func,
  onClear: PropTypes.func,
  onSearch: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};

Searchbox.defaultProps = {
  autoFocus: true,
  defaultQuery: '',
  onChange: _.noop,
  onClear: _.noop,
  placeholder: _.get(I18n, 'common.searchbox.placeholder')
};

export default Searchbox;
