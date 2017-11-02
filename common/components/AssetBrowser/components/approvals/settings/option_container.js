import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import ApprovalConfigurationOption from './approval_configuration_option';
import * as actions from 'common/components/AssetBrowser/actions/settings';

const mapStateToProps = (state) => ({
  presetStates: { ...state.settings.presetStates }
});

const mapDispatchToProps = dispatch => ({
  onOptionChange: (taskScope, newPresetState) => dispatch(actions.updateTaskPresetState(taskScope, newPresetState))
});

const OptionContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ApprovalConfigurationOption);

export default OptionContainer;
