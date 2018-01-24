import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import cssModules from 'react-css-modules';
import _ from 'lodash';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';
import Spinner from 'common/components/Spinner';

import styles from './index.module.scss';

/**
 <description>
 @prop soqlSlices
 @prop onSoqlChange
*/

class SoqlBuilder extends Component {

  addSoqlSlice = () => {
    let { onSoqlChange, soqlSlices } = this.props;
    if (!_.isEmpty(soqlSlices)) {
      soqlSlices.push({ logical_operator: 'and' });
    } else {
      soqlSlices.push({});
    }
    onSoqlChange(soqlSlices);
  };

  translationScope = 'shared.components.create_alert_modal.custom_alert';

  removeSoqlSlice = (index) => {
    let { onSoqlChange, soqlSlices } = this.props;

    soqlSlices.splice(index, 1);
    onSoqlChange(soqlSlices);
  };

  renderBuilder() {
    let { soqlSlices, viewId } = this.props;

    const slicesContent = soqlSlices.map((slice, index) =>
      <div styleName="soql-slices-section"> TODO: Slice content goes here </div>
    );

    return (
      <div styleName="soql-slices-section">
        <div>
          {slicesContent}
        </div>
        <button
          styleName="add-soql-slice-button"
          className="btn btn-primary add-parameter-button"
          onClick={this.addSoqlSlice}>
          + {I18n.t('add_params', { scope: 'shared.components.create_alert_modal.button' })}
        </button>
      </div>
    );
  }

  render() {
    const { isDataLoading } = this.state;
    return (
      <div styleName="soql-builder">
        {isDataLoading ? <Spinner /> : this.renderBuilder()}
      </div>
    );
  }
}

SoqlBuilder.defaultProps = {
  soqlSlices: []
};

SoqlBuilder.propTypes = {
  soqlSlices: PropTypes.array,
  viewId: PropTypes.string,
  onSoqlChange: PropTypes.func
};

export default cssModules(SoqlBuilder, styles, { allowMultiple: true });
