import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';

import Dropdown from '../../Dropdown';
import SocrataIcon from '../../SocrataIcon';
import SearchablePicklist from '../SearchablePicklist';
import FilterFooter from '../FilterFooter';
import FilterHeader from '../FilterHeader';
import { getTextFilter } from '../filters';

class TextFilter extends Component {
  constructor(props) {
    super(props);

    const { filter } = props;

    const selectedValues = _.map(filter.arguments, (argument) => {
      if (_.includes(['IS NULL', 'IS NOT NULL'], argument.operator)) {
        return null;
      }

      return argument.operand;
    });

    this.state = {
      value: '',
      selectedValues,
      autocompleteSuggestedValues: null,
      isNegated: _.toLower(filter.joinOn) === 'and',
      isValidating: false
    };

    _.bindAll(this, [
      'onChangeSearchTerm',
      'onSelectOption',
      'onUnselectOption',
      'updateSelectedValues',
      'updateAutocompleteSuggestedValues',
      'resetFilter',
      'updateFilter',
      'isDirty',
      'canAddSearchTerm',
      'renderHeader',
      'renderSelectedOption',
      'renderSuggestedOption'
    ]);
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  onChangeSearchTerm(searchTerm) {
    const { column, spandex } = this.props;

    if (spandex && spandex.available) {
      spandex.provider.fetchSuggestions(column.fieldName, searchTerm).
        then((searchResults) => {
          this.updateAutocompleteSuggestedValues(searchResults);
        }).
        catch((error) => {
          console.error(`Spandex believed to be available for ${spandex.datasetUid} but encountered error while fetching suggestions:`);
          console.error(error);
        });
    }
    this.setState({ value: searchTerm });
  }

  onSelectOption(option) {
    this.updateSelectedValues(_.union(this.state.selectedValues, [option.value]));
  }

  onUnselectOption(option) {
    this.updateSelectedValues(_.without(this.state.selectedValues, option.value));
  }

  updateSelectedValues(nextSelectedValues) {
    this.setState({
      selectedValues: _.uniq(nextSelectedValues)
    });
  }

  updateAutocompleteSuggestedValues(nextAutocompleteSuggestedValues) {
    this.setState({
      autocompleteSuggestedValues: _.map(nextAutocompleteSuggestedValues, (value) => {
        return { item: value };
      })
    });
  }

  // Remove existing selected values and clear the search term.
  resetFilter() {
    this.state.autocompleteSuggestedValues = null;
    this.updateSelectedValues([]);

    if (this.state.value !== '') {
      this.setState({ value: '' });
    }
  }

  updateFilter() {
    const { column, filter, onUpdate } = this.props;
    const { selectedValues, isNegated } = this.state;

    onUpdate(getTextFilter(column, filter, selectedValues, isNegated));
  }

  isDirty() {
    const { column, filter } = this.props;
    const { isNegated, selectedValues } = this.state;

    return !_.isEqual(getTextFilter(column, filter, selectedValues, isNegated), filter);
  }

  canAddSearchTerm(term) {
    const { column, isValidTextFilterColumnValue } = this.props;
    const trimmedTerm = term.trim();

    if (trimmedTerm.length === 0) {
      return Promise.reject();
    }

    this.setState({ isValidating: true });

    return isValidTextFilterColumnValue(column, trimmedTerm).
      then(() => {
        if (this.mounted) {
          this.setState({ isValidating: false, value: '' });
          this.onSelectOption({ name: trimmedTerm, value: trimmedTerm });

          // the apply button is rendered by FilterFooter, so we don't have direct access to it
          const applyButton = this.textFilter ?
            this.textFilter.querySelector('.apply-btn:not([disabled])') :
            null;

          if (applyButton) {
            applyButton.focus();
          }
        }
      }).
      catch(() => { // eslint-disable-line dot-notation
        if (this.mounted) {
          this.setState({ isValidating: false });
        }

        return Promise.reject();
      });
  }

  renderHeader() {
    const { column, controlSize, isReadOnly, onClickConfig } = this.props;
    const { isValidating } = this.state;

    const headerProps = {
      name: column.name,
      isReadOnly,
      onClickConfig
    };

    const dropdownProps = {
      onSelection: (option) => {
        this.setState({ isNegated: option.value === 'true' });
      },
      placeholder: this.state.isNegated ?
        I18n.t('shared.components.filter_bar.text_filter.is_not') :
        I18n.t('shared.components.filter_bar.text_filter.is'),
      options: [
        { title: I18n.t('shared.components.filter_bar.text_filter.is'), value: 'false' },
        { title: I18n.t('shared.components.filter_bar.text_filter.is_not'), value: 'true' }
      ],
      size: controlSize,
      disabled: isValidating
    };

    return (
      <FilterHeader {...headerProps}>
        <Dropdown {...dropdownProps} />
      </FilterHeader>
    );
  }

  renderSelectedOption(option) {
    const title = _.isNull(option.value) ? <em>{option.title}</em> : option.title;

    return (
      <div className="searchable-picklist-selected-option">
        <SocrataIcon name="filter" />
        <span className="searchable-picklist-selected-option-title">{title}</span>
        <SocrataIcon name="close-2" />
      </div>
    );
  }

  renderSuggestedOption(option) {
    const title = _.isNull(option.value) ? <em>{option.title}</em> : option.title;

    return (
      <div className="searchable-picklist-option">
        {title}
      </div>
    );
  }

  render() {
    const { column, controlSize, isReadOnly, spandex, onRemove } = this.props;
    const { value, selectedValues, autocompleteSuggestedValues, isValidating } = this.state;

    // Create the "null" suggestion to allow filtering on empty values.
    const nullOption = {
      title: I18n.t('shared.components.filter_bar.text_filter.no_value'),
      value: null,
      group: I18n.t('shared.components.filter_bar.text_filter.suggested_values'),
      render: this.renderSuggestedOption
    };

    const optionValues = _.isNil(autocompleteSuggestedValues) ?
      column.top :
      autocompleteSuggestedValues;
    const options = _.chain(optionValues).
      filter((text) => _.toLower(text.item).match(_.toLower(_.escapeRegExp(value)))).
      map((text) => ({
        title: text.item,
        value: text.item,
        group: I18n.t('shared.components.filter_bar.text_filter.suggested_values'),
        render: this.renderSuggestedOption
      })).
      value();

    const selectedOptions = _.map(selectedValues, (selectedValue) => ({
      title: _.isNull(selectedValue) ?
        I18n.t('shared.components.filter_bar.text_filter.no_value') :
        selectedValue,
      value: selectedValue,
      render: this.renderSelectedOption
    }));

    const picklistProps = {
      onBlur: _.noop,
      onSelection: this.onSelectOption,
      onChangeSearchTerm: this.onChangeSearchTerm,
      options: _.concat(nullOption, options).filter((option) => {
        return !_.includes(selectedValues, option.value);
      }),
      value,
      selectedOptions,
      size: controlSize,
      onClickSelectedOption: this.onUnselectOption,
      canAddSearchTerm: this.canAddSearchTerm,
      hideExactMatchPrompt: spandex && spandex.available
    };

    const footerProps = {
      disableApplyFilter: !this.isDirty() || isValidating,
      isReadOnly,
      onClickApply: this.updateFilter,
      onClickRemove: onRemove,
      onClickReset: this.resetFilter
    };

    return (
      <div className="filter-controls text-filter" ref={(el) => this.textFilter = el}>
        <div className="column-container">
          {this.renderHeader()}
          <SearchablePicklist {...picklistProps} />
        </div>

        <FilterFooter {...footerProps} />
      </div>
    );
  }
}

TextFilter.propTypes = {
  column: PropTypes.object.isRequired,
  controlSize: PropTypes.oneOf(['small', 'medium', 'large']),
  filter: PropTypes.object.isRequired,
  isReadOnly: PropTypes.bool,
  isValidTextFilterColumnValue: PropTypes.func,
  spandex: PropTypes.shape({
    available: PropTypes.bool,
    datasetUid: PropTypes.string.isRequired,
    domain: PropTypes.string.isRequired,
    provider: PropTypes.object // i.e. PropTypes.instanceOf(SpandexDataProvider)
  }),
  value: PropTypes.string,
  onClickConfig: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};

TextFilter.defaultProps = {
  isValidTextFilterColumnValue: (column, value) => Promise.reject(value)
};

export default TextFilter;
