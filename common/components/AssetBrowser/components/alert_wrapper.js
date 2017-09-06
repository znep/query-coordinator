import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SocrataIcon from 'common/components/SocrataIcon';
import I18n from 'common/i18n';

import { hideAlert } from '../actions/asset_actions';

export class AlertWrapper extends React.Component {
  render() {
    if (_.isEmpty(this.props.alert)) {
      if (this.hideAlertTimeout) {
        clearTimeout(this.hideAlertTimeout);
      }

      return null;
    }

    const { titleLocaleKey, bodyLocaleKey, time } = this.props.alert;

    const title = I18n.t(titleLocaleKey);
    const body = I18n.t(bodyLocaleKey);

    this.hideAlertTimeout = setTimeout(this.props.hideAlert, time);

    return (
      <div className="alert-wrapper">
        <div className="alert info">
          <strong>{title}</strong> {body}
          <a href="#" onClick={this.props.hideAlert}><SocrataIcon name="close-2" /></a>
        </div>
      </div>
    );
  }
}

AlertWrapper.propTypes = {
  alert: PropTypes.shape({
    bodyLocaleKey: PropTypes.string,
    time: PropTypes.number,
    titleLocaleKey: PropTypes.string
  }),
  hideAlert: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  alert: _.get(state, 'assetActions.alert')
});

const mapDispatchToProps = (dispatch) => ({
  hideAlert: () => dispatch(hideAlert())
});

export default connect(mapStateToProps, mapDispatchToProps)(AlertWrapper);
