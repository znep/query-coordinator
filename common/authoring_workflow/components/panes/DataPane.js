import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { Dropdown } from 'common/components';
import { I18n } from 'common/visualizations';

import { isLoading, hasData, hasError } from '../../selectors/metadata';
import {
  getLimitCount,
  getPrecision,
  getSeriesFromVif,
  getShowOtherCategory,
  getTreatNullValuesAsZero,
  getVisualizationType,
  isBarChart,
  isPieChart,
  isColumnChart,
  isTimelineChart
} from '../../selectors/vifAuthoring';
import { TIMELINE_PRECISION } from '../../constants';
import {
  setLimitNoneAndShowOtherCategory,
  setLimitCountAndShowOtherCategory,
  setShowOtherCategory,
  setPrecision,
  setTreatNullValuesAsZero
} from '../../actions';

import Accordion from '../shared/Accordion';
import AccordionPane from '../shared/AccordionPane';
import DebouncedInput from '../shared/DebouncedInput';
import BlockLabel from '../shared/BlockLabel';

import DimensionSelector from '../DimensionSelector';
import MeasureSelector from '../MeasureSelector';
import RegionSelector from '../RegionSelector';
import SelectedDimensionIndicator from '../SelectedDimensionIndicator';
import DimensionGroupingColumnNameSelector from '../DimensionGroupingColumnNameSelector';

export var DataPane = React.createClass({
  propTypes: {
    metadata: React.PropTypes.object,
    vifAuthoring: React.PropTypes.object
  },

  getDefaultProps() {
    return {
      timelinePrecision: _.cloneDeep(TIMELINE_PRECISION)
    };
  },

  renderMetadataLoading() {
    return (
      <div className="alert">
        <div className="metadata-loading">
          <span className="spinner-default metadata-loading-spinner"></span> {I18n.translate('panes.data.loading_metadata')}
        </div>
      </div>
    );
  },

  renderMetadataError() {
    return (
      <div className="metadata-error alert error">
        <strong>{I18n.translate('panes.data.uhoh')}</strong> {I18n.translate('panes.data.loading_metadata_error')}
      </div>
    );
  },

  renderLimitAndShowOtherCategory() {
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
    const limitCountDisabled = limitCount === null;

    // 'Do not limit results' radio button
    const limitNoneInputAttributes = {
      id: 'limit-none',
      type: 'radio',
      name: 'limit-radio',
      disabled: isPieChart(vifAuthoring),
      onChange: this.props.onSelectLimitNone,
      checked: limitCountDisabled
    };

    const limitNoneContainerAttributes = {
      id: 'limit-none-container',
      className: `${isPieChart(vifAuthoring) ? 'disabled': ''}`
    }

    const limitNoneContainer = (
      <div {...limitNoneContainerAttributes}>
        <input {...limitNoneInputAttributes} />
        <label htmlFor="limit-none">
          <span className="fake-radiobutton"/>
        </label>
        {I18n.translate(`panes.data.fields.${translationKey}.none`)}
      </div>
    );

    // 'Limit results' radio button
    const limitCountInputAttributes = {
      id: 'limit-count',
      type: 'radio',
      name: 'limit-radio',
      onChange: (event) => {
        const limitCountValueInput = this.limitCountValueContainerRef.querySelector('#limit-count-value');
        onSelectLimitCount({
          limitCount: parseInt(limitCountValueInput.value, 10),
          showOtherCategory: this.showOtherCategoryCheckbox.checked
        });
      },
      checked: !limitCountDisabled
    };

    // 'Limit results to' number input and other category group checkbox
    const limitCountValueContainerAttributes = {
      id: 'limit-count-value-container',
      ref: (ref) => this.limitCountValueContainerRef = ref,
      className: `authoring-field${(limitCountDisabled) ? ' disabled' : ''}`
    };

    const limitCountValueInputAttributes = {
      className: 'text-input',
      id: 'limit-count-value',
      type: 'number',
      min: 1,
      step: 1,
      onChange: (event) => {
        onChangeLimitCount({
          limitCount: parseInt(event.target.value, 10),
          showOtherCategory: this.showOtherCategoryCheckbox.checked
        });
      },
      value: _.isNumber(limitCount) ? limitCount : 10,
      disabled: limitCountDisabled
    };

    const showOtherCategoryInputAttributes = {
      id: 'show-other-category',
      ref: (ref) => this.showOtherCategoryCheckbox = ref,
      type: 'checkbox',
      onChange: this.props.onChangeShowOtherCategory,
      defaultChecked: showOtherCategory,
      disabled: limitCountDisabled
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
            {I18n.translate('panes.data.fields.show_other_category.title')}
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
        {I18n.translate(`panes.data.fields.${translationKey}.count`)}
        {limitCountValueContainer}
      </div>
    );

    const descriptionForPieChart = isPieChart(vifAuthoring) ?
      (
        <p className="authoring-field-description">
          <small>{I18n.translate('panes.data.fields.pie_chart_limit.description')}</small>
        </p>
      ) : null;

    return (
      <AccordionPane title={I18n.translate(`panes.data.fields.${translationKey}.title`)}>
        <span id="limit-subtitle">{I18n.translate(`panes.data.fields.${translationKey}.subtitle`)}</span>
        <div className="authoring-field">
          <div className="radiobutton">
            {limitNoneContainer}
            {limitCountContainer}
          </div>
        </div>
        {descriptionForPieChart}
      </AccordionPane>
    );
  },

  renderTimelinePrecision() {
    const { onSelectTimelinePrecision, timelinePrecision, vifAuthoring } = this.props;
    const defaultPrecision = getPrecision(vifAuthoring) || null;
    const options = _.map(timelinePrecision, (option) => {

      option.render = this.renderTimelinePrecisionOption;

      return option;
    });

    const attributes = {
      options,
      onSelection: onSelectTimelinePrecision,
      id: 'timeline-precision-selection',
      value: defaultPrecision
    };

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="timeline-precision">
          {I18n.translate('panes.data.fields.timeline_precision.title')}
        </label>
        <div id="timeline-precision" className="authoring-field">
          <Dropdown {...attributes} />
        </div>
      </div>
    );
  },

  renderTreatNullValuesAsZero() {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'treat-null-values-as-zero',
      type: 'checkbox',
      onChange: this.props.onChangeTreatNullValuesAsZero,
      defaultChecked: getTreatNullValuesAsZero(vifAuthoring)
    };

    return (
      <div className="authoring-field checkbox">
        <input {...inputAttributes} />
        <label className="inline-label" htmlFor="treat-null-values-as-zero">
          <span className="fake-checkbox">
            <span className="icon-checkmark3"></span>
          </span>
          {I18n.translate('panes.data.fields.treat_null_values_as_zero.title')}
        </label>
      </div>
    );
  },

  renderTimelineOptions() {
    const timelinePrecision = this.renderTimelinePrecision();
    const treatNullValuesAsZero = this.renderTreatNullValuesAsZero();

    return (
      <AccordionPane title={I18n.translate('panes.data.subheaders.timeline_options')}>
        {timelinePrecision}
        {treatNullValuesAsZero}
      </AccordionPane>
    );
  },

  render() {
    const { metadata, vifAuthoring } = this.props;

    let metadataInfo;
    let limitAndShowOtherCategory;

    if (hasError(metadata)) {
      metadataInfo = this.renderMetadataError();
    } else if (isLoading(metadata)) {
      metadataInfo = this.renderMetadataLoading();
    } else {
      const showLimitAndShowOtherCategory =
        isBarChart(vifAuthoring) ||
        isPieChart(vifAuthoring) ||
        isColumnChart(vifAuthoring);

      if (showLimitAndShowOtherCategory) {
        limitAndShowOtherCategory = this.renderLimitAndShowOtherCategory();
      }
    }

    const series = getSeriesFromVif(vifAuthoring);
    const dimensionGroupingAvailable = (
      (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring) || isTimelineChart(vifAuthoring)) && (series.length == 1)
    );
    const dimensionGroupingColumnNameTitle = I18n.translate(
      'panes.data.fields.dimension_grouping_column_name.title'
    );
    const dimensionGroupingColumnNameSelector = (dimensionGroupingAvailable) ?
      (
        <AccordionPane title={dimensionGroupingColumnNameTitle}>
          <DimensionGroupingColumnNameSelector />
        </AccordionPane>
      ) :
      null;

    const timelineOptions = isTimelineChart(vifAuthoring) ? this.renderTimelineOptions() : null;

    const sections = (
      <Accordion>
        <AccordionPane title={I18n.translate('panes.data.subheaders.data_selection')}>
          <div className="authoring-field">
            <BlockLabel
              htmlFor="dimension-selection"
              title={I18n.translate('panes.data.fields.dimension.title')}
              description={I18n.translate('panes.data.fields.dimension.description')}/>
            <SelectedDimensionIndicator />
          </div>
          <div className="authoring-field">
            <DimensionSelector/>
          </div>
          <div className="authoring-field">
            <MeasureSelector/>
          </div>
          <div className="authoring-field">
            <RegionSelector/>
          </div>
        </AccordionPane>
        {dimensionGroupingColumnNameSelector}
        {timelineOptions}
        {limitAndShowOtherCategory}
      </Accordion>
    );

    return (
      <form>
        {metadataInfo ? metadataInfo : sections}
      </form>
    );
  }
});

function mapStateToProps(state) {
  return {
    metadata: state.metadata,
    vifAuthoring: state.vifAuthoring
  };
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
    },

    onSelectTimelinePrecision: (timelinePrecision) => {
      dispatch(setPrecision(timelinePrecision.value));
    },

    onChangeTreatNullValuesAsZero: (event) => {
      const treatNullValuesAsZero = event.target.checked;

      dispatch(setTreatNullValuesAsZero(treatNullValuesAsZero));
    },
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(DataPane);
