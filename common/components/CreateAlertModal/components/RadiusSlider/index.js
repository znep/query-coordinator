import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import Slider from 'common/components/Slider';
import SocrataIcon from 'common/components/SocrataIcon';

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
    onChange(value + STEP);
  };

  onStepDown = () => {
    const { value, onChange } = this.props;
    onChange(value - STEP);
  };

  translationScope = 'shared.components.create_alert_modal.custom_alert';

  renderStepUpDownArrows() {
    return (
      <div styleName="section icon-section">
        <span className="icon-step-up" onClick={this.onStepUp}>
          <SocrataIcon name="arrow-up" />
        </span>
        <span className="icon-step-down" onClick={this.onStepDown}>
          <SocrataIcon name="arrow-down" />
        </span>
      </div>
    );
  }

  render() {
    const { value } = this.props;
    const sliderProps = {
      onChange: this.onChange,
      rangeMax: MAX_VALUE,
      rangeMin: MIN_VALUE,
      step: STEP,
      value: value
    };

    return (
      <div styleName="radius-slider">
        <div styleName="section radius-section">
          <Slider {...sliderProps} />
        </div>
        <div styleName="section">
          {I18n.t('radius_text', { scope: this.translationScope })}:
          {value}
        </div>
        {this.renderStepUpDownArrows()}
      </div>
    );
  }
}

RadiusSlider.defaultProps = {
  value: 1
};

RadiusSlider.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func
};

export default cssModules(RadiusSlider, styles, { allowMultiple: true });
