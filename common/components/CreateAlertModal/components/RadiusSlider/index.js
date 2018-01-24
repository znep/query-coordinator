import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import Slider from 'common/components/Slider';

import styles from './index.module.scss';

const MIN_VALUE = 1;
const MAX_VALUE = 10;
const STEP = 1;

/**
  Shows common/components/slider along with step up/down arrows.

  @prop onChange   - gets called when the selected value changes
  @prop value      - current value
*/
class RadiusSlider extends Component {
  onChange = (value) => {
    const { onChange } = this.props;

    onChange(_.clamp(value, MIN_VALUE, MAX_VALUE));
  };

  onStepUp = () => {
    const { value, onChange } = this.props;
    onChange(value + 1);
  };

  onStepDown = () => {
    const { value, onChange } = this.props;
    onChange(Number(value) - 1);
  };

  transalationScope = 'shared.components.create_alert_modal.custom_alert';

  renderStepUpDownArrows() {
    return (
      <div styleName="section">
        <span>
          <i className="socrata-icon-arrow-up" onClick={this.onStepUp} />
        </span>
        <span>
          <i className="socrata-icon-arrow-down" onClick={this.onStepDown} />
        </span>
      </div>
    );
  }

  render() {
    const { value } = this.props;
    const sliderProps = {
      rangeMin: MIN_VALUE,
      rangeMax: MAX_VALUE,
      step: STEP,
      onChange: this.onChange,
      value: value
    };

    return (
      <div styleName="radius-slider">
        <div styleName="section radius-section">
          <Slider {...sliderProps} />
        </div>
        <div styleName="section">
          {I18n.t('radius_text', { scope: this.transalationScope })}:
          {value}
        </div>
        {this.renderStepUpDownArrows()}
      </div>
    );
  }
}

RadiusSlider.defaultProps = {
  value: 1,
  onChange: _.noop
};

RadiusSlider.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func
};

export default cssModules(RadiusSlider, styles, { allowMultiple: true });
