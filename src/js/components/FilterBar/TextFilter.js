import _ from 'lodash';
import React, { PropTypes } from 'react';
import Dropdown from '../Dropdown';
import SearchablePicklist from './SearchablePicklist';
import FilterFooter from './FilterFooter';
import { getTextFilter } from './filters';
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

    const selectedValues = _.map(filter.arguments, (argument) => {
      if (_.includes(['IS NULL', 'IS NOT NULL'], argument.operator)) {
        return null;
      }

      return argument.operand;
    });

    return {
      value: '',
      suggestions: [],
      selectedValues,
      hasSearchError: false,
      isNegated: _.toLower(filter.joinOn) === 'and'
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

  onSelectOption(option) {
    this.updateSelectedValues(_.union(this.state.selectedValues, [option.value]));
  },

  onUnselectOption(option) {
    this.updateSelectedValues(_.without(this.state.selectedValues, option.value));
  },

  updateSelectedValues(nextSelectedValues) {
    this.setState({
      selectedValues: _.uniq(nextSelectedValues)
    });
  },

  // Remove existing selected values, clear the search term, and refetch suggestions if needed.
  clearFilter() {
    this.updateSelectedValues([]);

    if (this.state.value !== '') {
      this.setState({
        value: ''
      }, this.updateSuggestions);
    }
  },

  updateFilter() {
    const { column, filter, onUpdate } = this.props;
    const { selectedValues, isNegated } = this.state;

    onUpdate(getTextFilter(column, filter, selectedValues, isNegated));
  },

  isDirty() {
    const { column, filter } = this.props;
    const { isNegated, selectedValues } = this.state;

    return !_.isEqual(getTextFilter(column, filter, selectedValues, isNegated), filter);
  },

  renderHeader() {
    const { column } = this.props;

    const dropdownProps = {
      onSelection: (option) => {
        this.setState({ isNegated: option.value === 'true' });
      },
      placeholder: this.state.isNegated ?
        t('filter_bar.text_filter.is_not') :
        t('filter_bar.text_filter.is'),
      options: [
        { title: t('filter_bar.text_filter.is'), value: 'false' },
        { title: t('filter_bar.text_filter.is_not'), value: 'true' }
      ]
    };

    return (
      <div className="text-filter-header">
        <h3>{column.name}</h3>
        <Dropdown {...dropdownProps} />
      </div>
    );
  },

  render() {
    const { onCancel } = this.props;
    const { value, suggestions, hasSearchError, selectedValues } = this.state;

    // Create the "null" suggestion to allow filtering on empty values.
    const nullOption = {
      title: t('filter_bar.text_filter.no_value'),
      value: null,
      group: t('filter_bar.text_filter.suggested_values')
    };

    const options = _.map(suggestions, (suggestion) => {
      return {
        title: suggestion,
        value: suggestion,
        group: t('filter_bar.text_filter.suggested_values')
      };
    });

    const selectedOptions = _.map(selectedValues, (selectedValue) => {
      return {
        title: _.isNull(selectedValue) ?
          t('filter_bar.text_filter.no_value') :
          selectedValue,
        value: selectedValue
      };
    });

    const picklistProps = {
      onBlur: _.noop,
      onSelection: this.onSelectOption,
      onChangeSearchTerm: this.onChangeSearchTerm,
      hasSearchError,
      options: _.concat(nullOption, options).filter((option) => {
        return !_.includes(selectedValues, option.value);
      }),
      value,
      selectedOptions,
      onClickSelectedOption: this.onUnselectOption
    };

    const filterFooterProps = {
      disableApplyFilter: !this.isDirty(),
      onClickApply: this.updateFilter,
      onClickCancel: onCancel,
      onClickClear: this.clearFilter
    };

    return (
      <div className="filter-controls text-filter">
        <div className="column-container">
          {this.renderHeader()}
          <SearchablePicklist {...picklistProps} />
        </div>

        <FilterFooter {...filterFooterProps} />
      </div>
    );
  }
});

export default TextFilter;
