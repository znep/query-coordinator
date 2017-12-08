import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import { Dropdown } from 'common/components';

function t(subkey) {
  return I18n.t(`open_performance.measure.edit_modal.reporting_period.${subkey}`);
}

export class ReportingPeriodSize extends Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  renderOpen() {
    const { options, placeholder, onOptionSelected, collapsible } = this.props;
    const dropdownAttributes = {
      options,
      placeholder,
      onSelection: onOptionSelected,
      disabled: collapsible
    };
    return (
      <div>
        {
          collapsible && (
            <div>
              <a href="#" onClick={() => this.setState({ open: false })}>{t('show_less')}</a>
            </div>
          )
        }
        <div className="reporting-period-size">
          <h6>{t('choose_size_title')}</h6>
          <div>{t('choose_size_body')}</div>
          <Dropdown {...dropdownAttributes} />
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
  onOptionSelected: PropTypes.func.isRequired
};

export default ReportingPeriodSize;
