import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { SocrataIcon } from 'common/components';
import { COLUMN_TYPES } from '../constants';

export default class Dimension extends React.Component {
  renderRemoveButton() {
    const { onRemoveSelection } = this.props;

    return _.isFunction(onRemoveSelection) ? (
      <button className="btn btn-transparent btn-clear-dimension" onClick={onRemoveSelection}>
        <SocrataIcon name="close-2" />
      </button>
    ) : null;
  }

  render() {
    const { type, name, recommended } = this.props;

    const recommendedIndicator = recommended ? <span className="recommended-indicator" /> : null;
    const columnType = _.find(COLUMN_TYPES, { type });

    return (
      <div className="dimension">
        <span className={ columnType && columnType.icon }></span>
        <span>{ name }</span>
        { recommendedIndicator }
        { this.renderRemoveButton() }
      </div>
    );
  }
}

Dimension.defaultProps = {
  recommended: false
};

Dimension.propTypes = {
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  recommended: PropTypes.bool
};
