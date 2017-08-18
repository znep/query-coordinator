import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import I18n from 'common/i18n';

import {
  setLimitCountAndShowOtherCategory,
  setLimitNoneAndShowOtherCategory,
  setShowOtherCategory,
} from '../actions';

import {
  getLimitCount,
  getShowOtherCategory,
  getVisualizationType,
  isBarChart,
  isColumnChart,
  isPieChart,
} from '../selectors/vifAuthoring';

import BlockLabel from './shared/BlockLabel';
import DebouncedInput from './shared/DebouncedInput';
import GroupedStackedSelector from './GroupedStackedSelector';

export const DisplayOptions = React.createClass({
  propTypes: {
    vifAuthoring: PropTypes.object,
  },

  render() {
    const { vifAuthoring, onChangeLimitCount, onSelectLimitCount } = this.props;
    const limitCount = getLimitCount(vifAuthoring);
    const showOtherCategory = getShowOtherCategory(vifAuthoring);
    const visualizationType = getVisualizationType(vifAuthoring);
    const translationKeys = {
      barChart: 'bar_chart_limit',
      pieChart: 'pie_chart_limit',
      columnChart: 'column_chart_limit'
    };
    const translationKey = translationKeys[visualizationType];
    const limitCountDisabled = (limitCount === null);

    // 'Do not limit results' radio button
    const limitNoneInputAttributes = {
      checked: limitCountDisabled,
      disabled: isPieChart(vifAuthoring),
      id: 'limit-none',
      onChange: this.props.onSelectLimitNone,
      name: 'limit-radio',
      type: 'radio'
    };

    const limitNoneContainerAttributes = {
      className: `${isPieChart(vifAuthoring) ? 'disabled': ''}`,
      id: 'limit-none-container'
    }

    const limitNoneContainer = (
      <div {...limitNoneContainerAttributes}>
        <input {...limitNoneInputAttributes} />
        <label htmlFor="limit-none">
          <span className="fake-radiobutton"/>
        </label>
        {I18n.t(`shared.visualizations.panes.data.fields.${translationKey}.none`)}
      </div>
    );

    // 'Limit results' radio button
    const limitCountInputAttributes = {
      checked: !limitCountDisabled,
      id: 'limit-count',
      onChange: (event) => {
        const limitCountValueInput = this.limitCountValueContainerRef.querySelector('#limit-count-value');
        onSelectLimitCount({
          limitCount: parseInt(limitCountValueInput.value, 10),
          showOtherCategory: this.showOtherCategoryCheckbox.checked
        });
      },
      name: 'limit-radio',
      type: 'radio'
    };

    // 'Limit results to' number input and other category group checkbox
    const limitCountValueContainerAttributes = {
      className: `authoring-field${(limitCountDisabled) ? ' disabled' : ''}`,
      id: 'limit-count-value-container',
      ref: (ref) => this.limitCountValueContainerRef = ref
    };

    const limitCountValueInputAttributes = {
      className: 'text-input',
      disabled: limitCountDisabled,
      forceEnterKeyHandleChange: true,
      id: 'limit-count-value',
      min: 1,
      onChange: (event) => {
        onChangeLimitCount({
          limitCount: parseInt(event.target.value, 10),
          showOtherCategory: this.showOtherCategoryCheckbox.checked
        });
      },
      step: 1,
      type: 'number',
      value: _.isNumber(limitCount) ? limitCount : 10
    };

    const showOtherCategoryInputAttributes = {
      defaultChecked: showOtherCategory,
      disabled: limitCountDisabled,
      id: 'show-other-category',
      onChange: this.props.onChangeShowOtherCategory,
      ref: (ref) => this.showOtherCategoryCheckbox = ref,
      type: 'checkbox'
    };

    const limitCountValueContainer = (
      <div {...limitCountValueContainerAttributes}>
        <DebouncedInput {...limitCountValueInputAttributes} />
        <div id="show-other-category-container" className="checkbox">
          <input {...showOtherCategoryInputAttributes}/>
          <label className="inline-label" htmlFor="show-other-category">
            <span className="fake-checkbox">
              <span className="icon-checkmark3"/>
            </span>
            {I18n.t('shared.visualizations.panes.data.fields.show_other_category.title')}
          </label>
        </div>
      </div>
    );

    const limitCountContainer = (
      <div id="limit-count-container">
        <input {...limitCountInputAttributes} />
        <label htmlFor="limit-count">
          <span className="fake-radiobutton"/>
        </label>
        {I18n.t(`shared.visualizations.panes.data.fields.${translationKey}.count`)}
        {limitCountValueContainer}
      </div>
    );

    const descriptionForPieChart = isPieChart(vifAuthoring) ? (
        <p className="authoring-field-description">
          <small>{I18n.t('shared.visualizations.panes.data.fields.pie_chart_limit.description')}</small>
        </p>
      ) : 
      null;

    const groupedStackedSelector = (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring)) ?
      <GroupedStackedSelector /> :
      null;

    return (
      <div>
        {groupedStackedSelector}
        <div className="authoring-field">
          <span id="limit-subtitle">{I18n.t(`shared.visualizations.panes.data.fields.${translationKey}.subtitle`)}</span>
          <div className="radiobutton">
            {limitNoneContainer}
            {limitCountContainer}
          </div>
        </div>
        {descriptionForPieChart}
      </div>
    );
  },
});

function mapStateToProps(state) {
  const { vifAuthoring } = state;
  return { vifAuthoring };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectLimitNone: (event) => {
      const limitNone = event.target.checked;
      dispatch(setLimitNoneAndShowOtherCategory(limitNone, false));
    },

    onSelectLimitCount: (values) => {
      dispatch(setLimitCountAndShowOtherCategory(values.limitCount, values.showOtherCategory));
    },

    onChangeLimitCount: (values) => {
      dispatch(setLimitCountAndShowOtherCategory(values.limitCount, values.showOtherCategory));
    },

    onChangeShowOtherCategory: (event) => {
      const showOtherCategory = event.target.checked;
      dispatch(setShowOtherCategory(showOtherCategory));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DisplayOptions);