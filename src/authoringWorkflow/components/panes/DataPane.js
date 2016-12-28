import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../I18n';
import { onDebouncedEvent } from '../../helpers';
import { isLoading, hasData, hasError } from '../../selectors/metadata';
import {
  getVisualizationType,
  getLimitCount,
  getShowOtherCategory,
  isBarChart,
  isPieChart,
  isColumnChart
} from '../../selectors/vifAuthoring';
import { DEFAULT_LIMIT_FOR_SHOW_OTHER_CATEGORY } from '../../constants';
import {
  setLimitNoneAndShowOtherCategory,
  setLimitCountAndShowOtherCategory,
  setShowOtherCategory
} from '../../actions';

import Accordion from '../shared/Accordion';
import AccordionPane from '../shared/AccordionPane';

import VisualizationTypeSelector from '../VisualizationTypeSelector';
import DimensionSelector from '../DimensionSelector';
import MeasureSelector from '../MeasureSelector';
import RegionSelector from '../RegionSelector';

export var DataPane = React.createClass({
  propTypes: {
    metadata: React.PropTypes.object,
    vifAuthoring: React.PropTypes.object
  },

  renderMetadataLoading() {
    return (
      <div className="alert">
        <div className="metadata-loading">
          <span className="spinner-default metadata-loading-spinner"></span> {translate('panes.data.loading_metadata')}
        </div>
      </div>
    );
  },

  renderMetadataError() {
    return (
      <div className="metadata-error alert error">
        <strong>{translate('panes.data.uhoh')}</strong> {translate('panes.data.loading_metadata_error')}
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
      columnChart: 'column_chart_limit',
    };
    const translationKey = translationKeys[visualizationType];
    const limitCountDisabled = limitCount === null;

    // 'Do not limit results' radio button
    const limitNoneInputAttributes = {
      id: 'limit-none',
      type: 'radio',
      name: 'limit-radio',
      onChange: this.props.onSelectLimitNone,
      defaultChecked: limitCountDisabled
    };

    const limitNoneContainer = (
      <div id="limit-none-container">
        <input {...limitNoneInputAttributes} />
        <label htmlFor="limit-none">
          <span className="fake-radiobutton" />
        </label>
        {translate(`panes.data.fields.${translationKey}.none`)}
      </div>
    );

    // 'Limit results' radio button
    const limitCountInputAttributes = {
      id: 'limit-count',
      type: 'radio',
      name: 'limit-radio',
      onChange: onDebouncedEvent(this, onSelectLimitCount, (event) => {
        return {
          limitCount: parseInt(this.refs.limitCountValueInput.value, 10),
          showOtherCategory: this.refs.showOtherCategoryCheckbox.checked
        };
      }),
      defaultChecked: !limitCountDisabled
    };

    // 'Limit results to' number input and other category group checkbox
    const limitCountValueContainerAttributes = {
      id: 'limit-count-value-container',
      className: `authoring-field${(limitCountDisabled) ? ' disabled' : ''}`
    };

    const limitCountValueInputAttributes = {
      className: 'text-input',
      id: 'limit-count-value',
      ref: 'limitCountValueInput',
      type: 'number',
      min: 1,
      step: 1,
      onChange: onDebouncedEvent(this, onChangeLimitCount, (event) => {
        return {
          limitCount: parseInt(event.target.value, 10),
          showOtherCategory: this.refs.showOtherCategoryCheckbox.checked
        };
      }),
      defaultValue: DEFAULT_LIMIT_FOR_SHOW_OTHER_CATEGORY[visualizationType] || 10,
      disabled: limitCountDisabled
    };

    const showOtherCategoryInputAttributes = {
      id: 'show-other-category',
      ref: 'showOtherCategoryCheckbox',
      type: 'checkbox',
      onChange: this.props.onChangeShowOtherCategory,
      defaultChecked: showOtherCategory,
      disabled: limitCountDisabled
    };

    const limitCountValueContainer = (
      <div {...limitCountValueContainerAttributes}>
        <input {...limitCountValueInputAttributes} />
        <div id="show-other-category-container" className="checkbox">
          <input {...showOtherCategoryInputAttributes}/>
          <label className="inline-label" htmlFor="show-other-category">
            <span className="fake-checkbox">
              <span className="icon-checkmark3" />
            </span>
            {translate('panes.data.fields.show_other_category.title')}
          </label>
        </div>
      </div>
    );

    const limitCountContainer = (
      <div id="limit-count-container">
        <input {...limitCountInputAttributes} />
        <label htmlFor="limit-count">
          <span className="fake-radiobutton" />
        </label>
        {translate(`panes.data.fields.${translationKey}.count`)}
        {limitCountValueContainer}
      </div>
    );

    const descriptionForPieChart = isPieChart(vifAuthoring) ?
      (
        <p className="authoring-field-description">
          <small>{translate('panes.data.fields.pie_chart_limit.description')}</small>
        </p>
      ) : null;

    return (
      <AccordionPane title={translate(`panes.data.fields.${translationKey}.title`)}>
        <span id="limit-subtitle">{translate(`panes.data.fields.${translationKey}.subtitle`)}</span>
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

    const sections = (
      <Accordion>
        <AccordionPane title={translate('panes.data.subheaders.data_selection')}>
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
    }
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(DataPane);
