// This component needs to be ported to ES6 classes, see EN-16506.
/* eslint-disable react/prefer-es6-class */
import _ from 'lodash';
import Dropdown from '../Dropdown';
import FilterFooter from './FilterFooter';
import FilterHeader from './FilterHeader';
import I18n from 'common/i18n';
import React, { PropTypes } from 'react';
import SearchablePicklist from './SearchablePicklist';
import SocrataIcon from '../SocrataIcon';
import { getCheckboxFilter } from './filters';

export const CheckboxFilter = React.createClass({
  propTypes: {
    filter: PropTypes.object.isRequired,
    column: PropTypes.object.isRequired,
    controlSize: PropTypes.oneOf(['small', 'medium', 'large']),
    isReadOnly: PropTypes.bool,
    onClickConfig: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
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
      selectedValues,
      value: ''
    };
  },

  onSelectOption(option) {
    const value = this.stringToBoolean(option.value);
    this.updateSelectedValues(_.union(this.state.selectedValues, [value]));
  },

  onUnselectOption(option) {
    const value = this.stringToBoolean(option.value);
    this.updateSelectedValues(_.without(this.state.selectedValues, value));
  },

  booleanToLocalizedString(value) {
    if (value === true) {
      return I18n.t('shared.components.filter_bar.checkbox_filter.true_value');
    } else if (value === false) {
      return I18n.t('shared.components.filter_bar.checkbox_filter.false_value');
    } else {
      return I18n.t('shared.components.filter_bar.checkbox_filter.no_value');
    }
  },

  booleanToString(value) {
    if (value === true) {
      return 'true';
    } else if (value === false) {
      return 'false';
    } else {
      return null;
    }
  },

  stringToBoolean(value) {
    if (value === 'true') {
      return true;
    } else if (value === 'false') {
      return false;
    } else {
      return null;
    }
  },

  resetFilter() {
    this.updateSelectedValues([]);

    if (this.state.value !== '') {
      this.setState({ value: '' });
    }
  },

  updateFilter() {
    const { column, filter, onUpdate } = this.props;
    const { selectedValues } = this.state;

    onUpdate(getCheckboxFilter(column, filter, selectedValues));
  },

  updateSelectedValues(nextSelectedValues) {
    this.setState({
      selectedValues: _.uniq(nextSelectedValues)
    });
  },

  isDirty() {
    const { column, filter } = this.props;
    const { selectedValues } = this.state;

    return !_.isEqual(getCheckboxFilter(column, filter, selectedValues), filter);
  },

  renderHeader() {
    const { column, isReadOnly, onClickConfig } = this.props;

    const attributes = {
      isReadOnly,
      name: column.name,
      onClickConfig
    };

    return <FilterHeader {...attributes} />;
  },

  renderSelectedOption(option) {
    const title = _.isNull(option.value) ? <em>{option.title}</em> : option.title;

    return (
      <div className="searchable-picklist-selected-option">
        <SocrataIcon name="filter" />
        <span className="searchable-picklist-selected-option-title">{title}</span>
        <SocrataIcon name="close-2" />
      </div>
    );
  },

  renderSuggestedOption(option) {
    const title = _.isNull(option.value) ? <em>{option.title}</em> : option.title;

    return (
      <div className="searchable-picklist-option">
        {title}
      </div>
    );
  },

  render() {
    const { controlSize, isReadOnly, onRemove } = this.props;
    const { selectedValues, value } = this.state;

    const nullOption = {
      title: I18n.t('shared.components.filter_bar.checkbox_filter.no_value'),
      value: null,
      group: I18n.t('shared.components.filter_bar.checkbox_filter.suggested_values'),
      render: this.renderSuggestedOption
    };

    const falseOption = {
      title: I18n.t('shared.components.filter_bar.checkbox_filter.false_value'),
      value: 'false',
      group: I18n.t('shared.components.filter_bar.checkbox_filter.suggested_values'),
      render: this.renderSuggestedOption
    };

    const trueOption = {
      title: I18n.t('shared.components.filter_bar.checkbox_filter.true_value'),
      value: 'true',
      group: I18n.t('shared.components.filter_bar.checkbox_filter.suggested_values'),
      render: this.renderSuggestedOption
    };

    const options = _.filter([nullOption, trueOption, falseOption], (option) => {
      return !_.includes(selectedValues, this.stringToBoolean(option.value));
    })

    const selectedOptions = _.map(selectedValues, (selectedValue) => {
      return {
        title: _.isNull(selectedValue) ?
          I18n.t('shared.components.filter_bar.checkbox_filter.no_value') :
          this.booleanToLocalizedString(selectedValue),
        value: this.booleanToString(selectedValue),
        render: this.renderSelectedOption
      };
    });

    const picklistAttributes = {
      hideSearchInput: true,
      onBlur: _.noop,
      onChangeSearchTerm: _.noop,
      onClickSelectedOption: this.onUnselectOption,
      onSelection: this.onSelectOption,
      options,
      selectedOptions,
      size: controlSize,
      value
    };

    const footerAttributes = {
      disableApplyFilter: !this.isDirty(),
      isReadOnly,
      onClickApply: this.updateFilter,
      onClickRemove: onRemove,
      onClickReset: this.resetFilter
    };

    return (
      <div className="filter-controls text-filter">
        <div className="column-container">
          {this.renderHeader()}
          <SearchablePicklist {...picklistAttributes} />
        </div>
        <FilterFooter {...footerAttributes} />
      </div>
    );
  }
});

export default CheckboxFilter;
