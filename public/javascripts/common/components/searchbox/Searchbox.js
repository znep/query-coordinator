import React, { PropTypes } from 'react';
import { handleKeyPress } from '../../helpers/keyPressHelpers';

export class Searchbox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      query: this.props.defaultQuery
    };

    _.bindAll(this, ['clearQuery', 'handleChange', 'handleSearch']);
  }

  clearQuery(event) {
    event.preventDefault();
    this.props.onClear(this.state.query);
    this.setState({ query: '' }, this.handleSearch());
  }

  handleChange(query) {
    this.props.onChange(query);
    this.setState({ query });
  }

  handleSearch(query = '') {
    this.props.onSearch(query);
  }

  render() {
    const { autoFocus, placeholder } = this.props;
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
      autoFocus,
      className: 'text-input',
      onChange: (event) => this.handleChange(event.target.value),
      onKeyDown: handleKeyPress((event) => this.handleSearch(event.target.value)),
      placeholder,
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
