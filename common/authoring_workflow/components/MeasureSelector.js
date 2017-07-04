import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { factories, Dropdown } from 'common/components';
import { I18n } from 'common/visualizations';
import { AGGREGATION_TYPES, COLUMN_TYPES, MAXIMUM_MEASURES } from '../constants';
import { setMeasures } from '../actions';
import { getMeasuresFromVif, isFeatureMap } from '../selectors/vifAuthoring';
import { hasData, getValidMeasures } from '../selectors/metadata';
import BlockLabel from './shared/BlockLabel';

export const MeasureSelector = React.createClass({
  propTypes: {
    vifAuthoring: PropTypes.object,
    metadata: PropTypes.object,
    onSelectMeasures: PropTypes.func,
  },

  getDefaultProps() {
    return {
      aggregationTypes: AGGREGATION_TYPES
    };
  },

  componentDidUpdate() {
    if (this.selector) {
      new factories.FlyoutFactory(this.selector);
    }
  },

  render() {
    const { metadata } = this.props;
    return hasData(metadata) ? this.renderMeasureSelectors() : null;
  },

  renderMeasureSelectors() {
    const {
      metadata,
      vifAuthoring
    } = this.props;

    const validMeasures = getValidMeasures(metadata);
    const options = [
      {title: I18n.translate('panes.data.fields.measure.no_value'), value: null},
      ...validMeasures.map(validMeasure => ({
        title: validMeasure.name,
        value: validMeasure.fieldName,
        type: validMeasure.renderTypeName,
        render: this.renderMeasureOption
      }))
    ];

    const measures = getMeasuresFromVif(vifAuthoring);
    const items = measures.map((measure, index) => {
      return this.renderMeasureSelector(measure, index, options);
    });

    return (
      <div ref={(ref) => this.selector = ref}>
        <BlockLabel htmlFor="measure-selection" title={I18n.translate('panes.data.fields.measure.title')} description={I18n.translate('panes.data.fields.measure.description')} />
        <ul className="measure-list">
          {items}
        </ul>
        {this.renderNewMeasureLink()}
      </div>
    );
  },

  renderMeasureSelector(measure, index, options) {
    const { vifAuthoring } = this.props;
    const measureListItemAttributes = {
      className: 'measure-list-item',
      key: index
    };

    const hasOnlyDefaultValue = options.length <= 1;
    const measureAttributes = {
      className: 'measure-column-selector-dropdown',
      disabled: isFeatureMap(vifAuthoring) || hasOnlyDefaultValue,
      onSelection: (option) => this.handleOnSelectionMeasureColumn(option, index),
      options,
      value: measure.columnName
    };

    return (
        <li {...measureListItemAttributes}>
          <div className="measure-column-selector-dropdown-container">
            <Dropdown {...measureAttributes} />
          </div>
          {this.renderMeasureAggregationSelector(measure, index)}
          {this.renderDeleteLink(index)}
        </li>
    );    
  },

  renderDeleteLink(index) {
    const { vifAuthoring } = this.props;
    const measures = getMeasuresFromVif(vifAuthoring);

    return (measures.length > 1) ? (
      <div className="measure-delete-link-container">
        <a className="measure-delete-link" onClick={() => this.handleOnClickDeleteMeasure(index)}>
          <span className="socrata-icon-close" />
        </a>
      </div>) : null;
  },

  renderMeasureAggregationSelector(measure, index) {
    const {
      aggregationTypes,
      vifAuthoring
    } = this.props;

    if (_.isNull(measure.columnName)) {
      return; // no aggregation dropdown when no column name is selected
    }

    const options = [
      {title: I18n.translate('aggregations.none'), value: null},
      ...aggregationTypes.map(aggregationType => ({title: aggregationType.title, value: aggregationType.type}))
    ];

    const measureAggregationAttributes = {
      disabled: isFeatureMap(vifAuthoring),
      onSelection: (option) => this.handleOnSelectionMeasureAggregation(option, index),
      options,
      value: measure.aggregationFunction
    };

    return (
      <div className="measure-aggregation-selector-dropdown-container">
        <Dropdown {...measureAggregationAttributes} />
      </div>);
},

  renderMeasureOption(option) {
    const columnType = _.find(COLUMN_TYPES, {type: option.type});
    const icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-selector-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  },

  renderNewMeasureLink() {
    const { vifAuthoring } = this.props;
    const measures = getMeasuresFromVif(vifAuthoring);

    return (measures.length < MAXIMUM_MEASURES) ? (
      <div className="measure-new-measure-link-container">
        <a onClick={this.handleOnClickNewMeasure}>
          <span className="socrata-icon-add" />
          {I18n.translate('panes.data.fields.measure.new_measure')}
        </a>
      </div>) : null;
  },

  handleOnSelectionMeasureColumn(option, index) {
    const { onSelectMeasures } = this.props;
    const measures = this.getClonedMeasures();  

    measures[index].columnName = option.value;

    if (_.isNull(option.value)) {
      measures[index].aggregationFunction = 'count';
    } else if (measures[index].aggregationFunction === 'count') {
      measures[index].aggregationFunction = 'sum';
    }

    onSelectMeasures(measures);
  },

  handleOnSelectionMeasureAggregation(option, index) {
    const { onSelectMeasures } = this.props;
    const measures = this.getClonedMeasures();  

    measures[index].aggregationFunction = option.value;
    onSelectMeasures(measures);
  },

  handleOnClickDeleteMeasure(index) {
    const { onSelectMeasures } = this.props;
    const measures = this.getClonedMeasures();

    measures.splice(index, 1);
    onSelectMeasures(measures);
  },

  handleOnClickNewMeasure() {
    const { onSelectMeasures } = this.props;
    const measures = this.getClonedMeasures();  

    measures.push({ 
      columnName: null,
      aggregationFunction: 'count'
    });

    onSelectMeasures(measures);
  },
  
  getClonedMeasures() {
    const { vifAuthoring } = this.props;
    const measures = getMeasuresFromVif(vifAuthoring);
    return _.cloneDeep(measures);
  }
});

function mapStateToProps(state) {
  const { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectMeasures(measures) {
      dispatch(setMeasures(measures));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MeasureSelector);
