import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';

import SocrataIcon from 'common/components/SocrataIcon';
import I18n from 'common/i18n';

export class BackButton extends Component {
  render() {
    return (
      <button className="btn btn-default btn-sm back-button" onClick={this.props.onClick}>
        <SocrataIcon name="arrow-prev" />
        {` ${I18n.t('common.action_buttons.back')}`}
      </button>
    );
  }
}

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired
};

export default BackButton;
