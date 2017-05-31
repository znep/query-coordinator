import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';

import { translate } from '../../I18n';
import {
  getAnyDimension,
  getVisualizationType
} from '../selectors/vifAuthoring';

import {
  getRecommendedDimensions,
  getValidDimensions
} from '../selectors/metadata';

import { setDimension } from '../actions';

import Dimension from './Dimension';

export class SelectedDimensionIndicator extends React.Component {
  renderDimension() {
    const { dimensionFieldName, validDimensions, recommendedDimensions, onRemoveSelection } = this.props;
    const dimension = _.find(validDimensions, { fieldName: dimensionFieldName });
    const recommended = !_.isNil(_.find(recommendedDimensions, { fieldName: dimensionFieldName }));
    const attributes = {
      type: dimension.renderTypeName,
      name: dimension.name,
      recommended,
      onRemoveSelection
    };

    return <Dimension {...attributes} />;
  }

  renderEmpty() {
    return <span>{ translate('panes.data.fields.dimension.empty_selection') }</span>;
  }

  render() {
    const { dimensionFieldName } = this.props;

    const classes = classNames('selected-dimension-indicator', {
      empty: _.isNull(dimensionFieldName)
    });

    return (
      <div className={ classes }>
        { dimensionFieldName ? this.renderDimension() : this.renderEmpty() }
      </div>
    );
  }
}


const mapStateToProps = (state) => {
  const { vifAuthoring, metadata } = state;
  const visualizationType = getVisualizationType(vifAuthoring);

  return {
    dimensionFieldName: _.get(getAnyDimension(vifAuthoring), 'columnName', null),
    validDimensions: getValidDimensions(metadata),
    recommendedDimensions: getRecommendedDimensions(metadata, visualizationType)
  };
};

const mapDispatchToProps = (dispatch) => ({
  onRemoveSelection: () => dispatch(setDimension(null))
});

export default connect(mapStateToProps, mapDispatchToProps)(SelectedDimensionIndicator);
