import _ from 'lodash';
import React, { PropTypes } from 'react';
import { translate as t } from '../../common/I18n';
import Picklist from '../Picklist';

export const SearchablePicklist = React.createClass({
  propTypes: {
    options: PropTypes.arrayOf(PropTypes.object),
    value: PropTypes.string,
    onChangeSearchTerm: PropTypes.func.isRequired,
    onSelection: PropTypes.func.isRequired
  },

  componentDidMount() {
    if (this.search) {
      this.search.focus();
    }
  },

  onChangeSearchTerm(event) {
    this.props.onChangeSearchTerm(event.target.value);
  },

  renderPicklist() {
    const { options, value, onSelection } = this.props;
    const hasNoOptions = _.isEmpty(options);
    let visibleOptions = options;

    if (hasNoOptions) {
      visibleOptions = [
        { title: t('filter_bar.no_options_found') }
      ];
    }

    const picklistProps = {
      options: visibleOptions,
      value,
      disabled: hasNoOptions,
      onSelection: onSelection
    };

    return <Picklist {...picklistProps} />;
  },

  renderSearch() {
    const { value } = this.props;

    return (
      <div className="searchable-picklist-input-container">
        <span className="socrata-icon-search" role="presentation" />
        <input
          className="searchable-picklist-input"
          type="text"
          aria-label={t('filter_bar.search')}
          value={value || ''}
          ref={(el) => this.search = el}
          onChange={this.onChangeSearchTerm} />
      </div>
    );
  },

  render() {
    return (
      <div className="searchable-picklist">
        {this.renderSearch()}
        {this.renderPicklist()}
      </div>
    );
  }
});

export default SearchablePicklist;
