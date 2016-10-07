import _ from 'lodash';
import React, { PropTypes } from 'react';
import SearchablePicklist from './SearchablePicklist';
import FilterFooter from './FilterFooter';

export const TextFilter = React.createClass({
  propTypes: {
    filter: PropTypes.object.isRequired,
    column: PropTypes.object.isRequired,
    fetchSuggestions: PropTypes.func,
    onCancel: PropTypes.func,
    onUpdate: PropTypes.func
  },

  getDefaultProps() {
    return {
      onCancel: _.noop,
      onUpdate: _.noop
    };
  },

  getInitialState() {
    return {
      isLoading: true,
      value: _.get(this.props.filter, 'parameters.arguments.operand'),
      suggestions: []
    };
  },

  componentDidMount() {
    const { fetchSuggestions, column } = this.props;

    this.isMounted = true;

    fetchSuggestions(column, '').then((suggestions) => {
      if (this.isMounted) {
        this.setState({
          suggestions,
          isLoading: false
        });
      }
    });
  },

  componentWillUnmount() {
    this.isMounted = false;
  },

  onChangeSearchTerm(searchTerm) {
    const { fetchSuggestions, column } = this.props;

    this.setState({
      loading: true,
      value: searchTerm
    }, () => {
      fetchSuggestions(column, searchTerm).then((suggestions) => {
        if (this.isMounted) {
          this.setState({
            suggestions,
            isLoading: false
          });
        }
      });
    });
  },

  onSelectSuggestion(suggestion) {
    this.setState({
      value: suggestion.title
    });
  },

  clearFilter() {
    this.setState({
      value: null
    });
  },

  updateFilter() {
    const { filter, onUpdate } = this.props;
    const { value } = this.state;

    const newFilter = _.merge({}, filter, {
      parameters: {
        arguments: {
          operand: value
        }
      }
    });

    onUpdate(newFilter);
  },

  render() {
    const { filter, onCancel } = this.props;
    const { isLoading, value, suggestions } = this.state;

    const picklistProps = {
      isLoading: isLoading,
      onSelection: this.onSelectSuggestion,
      onChangeSearchTerm: this.onChangeSearchTerm,
      options: _.map(suggestions, (suggestion) => {
        return {
          title: suggestion,
          value: suggestion
        };
      }),
      value
    };

    const filterFooterProps = {
      disableApplyFilter: _.isEqual(value, _.get(filter, 'parameters.arguments.operand')),
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
