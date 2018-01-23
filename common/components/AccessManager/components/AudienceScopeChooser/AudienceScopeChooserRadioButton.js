import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import SocrataIcon from 'common/components/SocrataIcon';

import AudienceScopePropType from 'common/components/AccessManager/propTypes/AudienceScopePropType';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';

import AudienceScopeLabel from './AudienceScopeLabel';
import styles from './radio-button.module.scss';

/**
 * Radio button with an audience label that will update the state with
 * its selected option.
 *
 * The "scope" passed in as props is used to determine the label to show,
 * and is used when updating the state onChange.
 */
class AudienceScopeChooserRadioButton extends Component {
  static propTypes = {
    scope: PropTypes.string.isRequired,
    currentScope: AudienceScopePropType,
    changeScope: PropTypes.func.isRequired
  };

  static defaultProps = {
    currentScope: null
  };

  renderCheckMark = () => (
    <div styleName="checkmark-icon-container">
      <SocrataIcon name="checkmark3" styleName="checkmark-icon" />
    </div>
  )

  render() {
    const { scope, currentScope, changeScope } = this.props;
    const checked = currentScope === scope;

    return (
      <button
        type="button"
        onClick={() => changeScope(scope)}
        styleName={checked ? 'audience-button-checked' : 'audience-button-unchecked'}>
        {checked && this.renderCheckMark()}
        <AudienceScopeLabel scope={scope} />
      </button>
    );
  }
}

const mapStateToProps = state => ({
  currentScope: state.permissions.permissions ? state.permissions.permissions.scope : null
});

const mapDispatchToProps = dispatch => ({
  changeScope: scope => dispatch(permissionsActions.changeAudienceScope(scope))
});

export default
  connect(mapStateToProps, mapDispatchToProps)(cssModules(AudienceScopeChooserRadioButton, styles));
