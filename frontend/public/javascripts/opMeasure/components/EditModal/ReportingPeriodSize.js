import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { Dropdown } from 'common/components';

import { PeriodTypes } from 'common/performance_measures/lib/constants';
const { OPEN, CLOSED } = PeriodTypes;

function t(subkey) {
  return I18n.t(`open_performance.measure.edit_modal.reporting_period.${subkey}`);
}

export class ReportingPeriodSize extends Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  renderOpen() {
    const { options, placeholder, onOptionSelected, collapsible, type } = this.props;
    const dropdownAttributes = {
      options,
      placeholder,
      showOptionsBelowHandle: true,
      onSelection: onOptionSelected,
      disabled: collapsible
    };
    const imgClassName = classNames('sample-viz', {
      'grayed-out': collapsible
    });
    const imgProps = {
      className: imgClassName,
      src: `/images/opMeasure/sample-viz-${type}.png`
    };

    return (
      <div>
        {
          /* Include the "Show Less" link or a spacer */
          collapsible ? (
            <div>
              <a href="#" onClick={() => this.setState({ open: false })}>{t('show_less')}</a>
            </div>
          ) : (
            <div>&nbsp;</div>
          )
        }
        <div className="reporting-period-size">
          <h6>{t('choose_size_title')}</h6>
          <div className="choose-size-body">{t('choose_size_body')}</div>
          <Dropdown {...dropdownAttributes} />
          <img alt={t(`sample_${type}`)} {...imgProps} />
        </div>
      </div>
    );
  }

  renderClosed() {
    return (
      <div>
        <a href="#" onClick={() => this.setState({ open: true })}>{t('show_more')}</a>
      </div>
    );
  }

  render() {
    const closed = this.props.collapsible && !this.state.open;
    return closed ? this.renderClosed() : this.renderOpen();
  }
}

ReportingPeriodSize.propTypes = {
  collapsible: PropTypes.bool,
  options: PropTypes.array.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.oneOf([OPEN, CLOSED]),
  onOptionSelected: PropTypes.func.isRequired
};

export default ReportingPeriodSize;
