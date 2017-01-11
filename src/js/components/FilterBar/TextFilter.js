import _ from 'lodash';
import React, { PropTypes } from 'react';
import SearchablePicklist from './SearchablePicklist';
import FilterFooter from './FilterFooter';
import { getDefaultFilterForColumn } from './filters';

export const TextFilter = React.createClass({
  propTypes: {
    filter: PropTypes.object.isRequired,
    column: PropTypes.object.isRequired,
    fetchSuggestions: PropTypes.func,
    onCancel: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      value: _.get(this.props.filter, 'arguments.operand', ''),
      suggestions: [],
      hasSearchError: false
    };
  },

  componentDidMount() {
    this.isMounted = true;

    this.updateSuggestions = _.debounce(() => {
      const { column } = this.props;
      const { value } = this.state;
      this.props.fetchSuggestions(column, _.defaultTo(value, '')).then((suggestions) => {
        if (!_.isArray(suggestions)) {
          throw new Error(`Invalid response from suggestion provider: ${suggestions}`);
        } else if (this.isMounted) {
          this.setState({
            suggestions,
            hasSearchError: false
          });
        }
      }).catch(() => {
        this.setState({
          suggestions: [],
          hasSearchError: true
        });
      });
    }, 350, { leading: true, maxWait: 500 });

    this.updateSuggestions();
  },

  componentWillUnmount() {
    this.isMounted = false;
  },

  onChangeSearchTerm(searchTerm) {
    this.setState({
      loading: true,
      value: searchTerm
    }, this.updateSuggestions);
  },

  onSelectSuggestion(suggestion) {
    this.setState({
      value: suggestion.title
    });
  },

  clearFilter() {
    if (this.state.value !== '') {
      this.setState({
        value: ''
      }, this.updateSuggestions);
    }
  },

  updateFilter() {
    const { column, filter, onUpdate } = this.props;
    const { value } = this.state;

    if (_.isEmpty(value)) {
      onUpdate(getDefaultFilterForColumn(column));
    } else {
      onUpdate(_.merge(filter, {
        'function': 'binaryOperator',
        arguments: {
          operator: '=',
          operand: value
        }
      }));
    }
  },

  render() {
    const { filter, onCancel } = this.props;
    const { value, suggestions, hasSearchError } = this.state;

    const picklistProps = {
      onSelection: this.onSelectSuggestion,
      onChangeSearchTerm: this.onChangeSearchTerm,
      hasSearchError,
      options: _.map(suggestions, (suggestion) => {
        return {
          title: suggestion,
          value: suggestion
        };
      }),
      value
    };

    const filterFooterProps = {
      disableApplyFilter: _.isEqual(value, _.get(filter.arguments, 'operand', '')),
      onClickApply: this.updateFilter,
      onClickCancel: onCancel,
      onClickClear: this.clearFilter
    };

    return (
      <div className="filter-controls text-filter">
        <div className="column-container">
          <SearchablePicklist {...picklistProps} />
        </div>

        <FilterFooter {...filterFooterProps} />
      </div>
    );
  }
});

export default TextFilter;
