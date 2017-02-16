import _ from 'lodash';
import React, { PropTypes } from 'react';
import SearchablePicklist from './SearchablePicklist';
import FilterFooter from './FilterFooter';
import { getDefaultFilterForColumn } from './filters';
import { translate as t } from '../../common/I18n';

export const TextFilter = React.createClass({
  propTypes: {
    filter: PropTypes.object.isRequired,
    column: PropTypes.object.isRequired,
    fetchSuggestions: PropTypes.func,
    onCancel: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
    value: PropTypes.string
  },

  getInitialState() {
    const { filter } = this.props;
    return {
      value: '',
      suggestions: [],
      hasSearchError: false,
      // It's conceivable that _.map(), when used with the string key getter,
      // might return [undefined], which is just odd enough of a shape that it
      // might cause rendering to get messed up downstream. Calling _.compact()
      // on it should make it less conceivable.
      selectedValues: _.uniq(_.compact(_.map(filter.arguments, 'operand')))
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
    const { selectedValues } = this.state;

    // add new value to selectedValues
    if (!_.includes(selectedValues, suggestion)) {
      selectedValues.push(suggestion.value);
    }

    this.updateSelectedValues(selectedValues);
  },

  onClickSelectedValue(selectedValue) {
    const { selectedValues } = this.state;

    // remove value from selected values
    const nextSelectedValues = _.without(selectedValues, selectedValue);

    this.updateSelectedValues(nextSelectedValues);
  },

  updateSelectedValues(nextSelectedValues) {
    this.setState({
      selectedValues: _.uniq(nextSelectedValues)
    });
  },

  clearFilter() {
    // If we clear the filter
    // - existing selected values are removed
    // - the current search term should be set to empty
    // - and spandex refetches suggestions (this will have to change if we use top-n values)
    this.updateSelectedValues([]);

    if (this.state.value !== '') {
      this.setState({
        value: ''
      }, this.updateSuggestions);
    }
  },

  makeBinaryOperatorFilter() {
    const { column, filter } = this.props;
    const { selectedValues } = this.state;

    if (_.isEmpty(selectedValues)) {
      return getDefaultFilterForColumn(column);
    } else {
      return (
        _.assign(filter, {
          'function': 'binaryOperator',
          arguments: _.map(selectedValues, (selectedValue) => {
            return {
              operator: '=',
              operand: selectedValue
            };
          })
        })
      );
    }
  },

  updateFilter() {
    const { onUpdate } = this.props;
    onUpdate(this.makeBinaryOperatorFilter());
  },

  render() {
    const { filter, onCancel } = this.props;
    const { value, suggestions, hasSearchError, selectedValues } = this.state;

    const picklistProps = {
      onBlur: _.noop,
      onSelection: this.onSelectSuggestion,
      onChangeSearchTerm: this.onChangeSearchTerm,
      hasSearchError,
      options: _.map(suggestions, (suggestion) => {
        return {
          title: suggestion,
          value: suggestion,
          group: t('filter_bar.text_filter.suggested_values')
        };
      }),
      value,
      selectedValues,
      onClickSelectedValue: this.onClickSelectedValue
    };

    // When selected values are changed, we do want to enable apply
    const disableApplyFilter = _.isEqual(selectedValues, _.map(filter.arguments, 'operand'));

    const filterFooterProps = {
      disableApplyFilter,
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
