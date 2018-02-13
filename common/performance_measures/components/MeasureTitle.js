import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

// Just a measure title. Single line display, 100% width, ellipsis truncation. Intended to be used in
// MeasureResultCard and MeasureChart.
export class MeasureTitle extends Component {
  static propTypes = {
    measure: PropTypes.shape({
      metadata: PropTypes.shape({
        shortName: PropTypes.string
      })
    }),
    lens: PropTypes.shape({
      name: PropTypes.string
    })
  };

  render() {
    const { lens, measure } = this.props;
    let title = _.get(measure, 'metadata.shortName');

    if (_.isEmpty(title)) {
      title = _.get(lens, 'name');
    }

    return (
      <div className="measure-title" title={title}>
        {title}
      </div>
    );
  }
}

export default MeasureTitle;
