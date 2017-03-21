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
    this.setState({ query: '' }, this.handleSearch());
  }

  handleChange(event) {
    this.setState({ query: event.target.value });
  }

  handleSearch(query = '') {
    this.props.onSearch(query);
  }

  render() {
    const clearSearchButton = (this.state.query ?
      <button
        aria-label={_.get(I18n, 'common.searchbox.clear')}
        className="clear-search socrata-icon-close-2"
        onClick={this.clearQuery}
        title={_.get(I18n, 'common.searchbox.clear')} /> : null
    );

    const inputProps = {
      'aria-label': this.props.placeholder,
      className: 'text-input []',
      onChange: this.handleChange,
      onKeyDown: handleKeyPress((event) => this.handleSearch(event.target.value)),
      placeholder: this.props.placeholder,
      type: 'text',
      value: this.state.query
    };

    return (
      <div className="searchbox">
        <span className="socrata-icon-search"></span>
        <input {...inputProps} />
        {clearSearchButton}
      </div>
    );
  }
}

Searchbox.propTypes = {
  defaultQuery: PropTypes.string,
  onSearch: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};

Searchbox.defaultProps = {
  defaultQuery: '',
  placeholder: _.get(I18n, 'common.searchbox.placeholder')
};

export default Searchbox;
