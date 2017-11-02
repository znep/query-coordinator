import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Settings from './settings';
import * as actions from 'common/components/AssetBrowser/actions/settings';

class SettingsContainer extends Component {
  componentWillMount() {
    this.props.fetchSettings();
  }

  render() {
    return <Settings { ...this.props } />;
  }
}

const mapStateToProps = (state) => ({
  reapprovalPolicy: state.settings.reapprovalPolicy
});

const mapDispatchToProps = dispatch => ({
  onReapprovalClick: () => dispatch(actions.toggleReapproval()),
  fetchSettings: () => dispatch(actions.fetchSettings())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SettingsContainer);
