import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SocrataIcon from 'common/components/SocrataIcon';

import { hideAlert } from '../actions/asset_actions';

export class AlertWrapper extends Component {
  render() {
    if (_.isEmpty(this.props.alert)) {
      if (this.hideAlertTimeout) {
        clearTimeout(this.hideAlertTimeout);
      }

      return null;
    }

    const { title, body, time } = this.props.alert;

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
    body: PropTypes.string,
    time: PropTypes.number,
    title: PropTypes.string
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
