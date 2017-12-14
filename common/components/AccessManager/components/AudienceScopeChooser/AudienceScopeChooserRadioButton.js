import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import styles from './radio-button.scss';
import AudienceScopePropType from '../../propTypes/AudienceScopePropType';
import * as permissionsActions from '../../actions/PermissionsActions';
import AudienceScopeLabel from '../AudienceScopeLabel';

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

  render() {
    const { scope, currentScope, changeScope } = this.props;
    const id = `visibility-changer-radio-button-${scope}`;

    return (
      <label htmlFor={id} styleName="container">
        <input
          id={id}
          type="radio"
          name="visibility"
          checked={currentScope === scope}
          onChange={() => changeScope(scope)}
          styleName="radio-button" />
        <div styleName="label">
          <AudienceScopeLabel scope={scope} />
        </div>
      </label>
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
