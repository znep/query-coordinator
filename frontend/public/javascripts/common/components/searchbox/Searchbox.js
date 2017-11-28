import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import I18n from 'common/i18n';
import { handleEnter } from 'common/dom_helpers/keyPressHelpers';

import './_searchbox.scss';

export class Searchbox extends React.Component {
  static scope() {
    return 'common.searchbox';
  }

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
        aria-label={I18n.t('clear', { scope: Searchbox.scope() })}
        className="clear-search socrata-icon-close-2"
        onClick={this.clearQuery}
        title={I18n.t('clear', { scope: Searchbox.scope() })} /> : null
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
  placeholder: I18n.t('placeholder', { scope: Searchbox.scope() })
};

export default Searchbox;
