import includes from 'lodash/fp/includes';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import { spring } from 'react-motion';

import Button from 'common/components/Button';
import ConditionTransitionMotion from 'common/components/ConditionTransitionMotion';
import { customConnect, I18nPropType } from 'common/connectUtils';

import * as Actions from '../actions';
import * as Selectors from '../adminRolesSelectors';
import { EDIT_CUSTOM_ROLES, EDIT_INDIVIDUAL_CUSTOM_ROLE, SAVING } from '../appStates';
import styles from './save-bar.module.scss';

const mapStateToProps = state => {
  const appState = Selectors.getAppState(state);
  const dirtyRoles = Selectors.getDirtyRolesFromState(state);
  return {
    isEditMode: includes(appState, [EDIT_CUSTOM_ROLES, SAVING, EDIT_INDIVIDUAL_CUSTOM_ROLE]),
    isSaving: appState === SAVING,
    hasCustomRoles: Selectors.stateHasCustomRoles(state),
    dirtyRoles,
    hasDirtyRoles: dirtyRoles.size
  };
};

const mapDispatchToProps = {
  editCustomRolesCancel: Actions.editCustomRolesCancel,
  saveRoles: Actions.saveRoles
};

class SaveBar extends Component {
  static propTypes = {
    I18n: I18nPropType,
    editCustomRolesCancel: PropTypes.func.isRequired,
    dirtyRoles: PropTypes.object.isRequired,
    isSaving: PropTypes.bool.isRequired,
    saveRoles: PropTypes.func.isRequired,
    style: PropTypes.object.isRequired
  };

  renderCancelButton = () => {
    const { editCustomRolesCancel, isSaving, I18n } = this.props;

    return (
      <Button
        variant="primary"
        inverse={!isSaving}
        buttonDisabledStyle={'light'}
        disabled={isSaving}
        onClick={editCustomRolesCancel}
      >
        {I18n.t('screens.admin.roles.buttons.cancel')}
      </Button>
    );
  };

  renderSaveButton = () => {
    const { dirtyRoles, isSaving, saveRoles, I18n } = this.props;

    return (
      <Button
        variant="primary"
        busy={isSaving}
        styleName="save-button"
        onClick={() => saveRoles(dirtyRoles)}
        disabled={isSaving}
      >
        <div style={{ visibility: isSaving ? 'hidden' : 'inline' }}>
          {I18n.t('screens.admin.roles.buttons.save')}
        </div>
        {isSaving && (
          <div styleName="spinner-container">
            <span className="spinner-default spinner-btn-primary" />
          </div>
        )}
      </Button>
    );
  };

  render() {
    const { style } = this.props;

    return (
      <div style={style} styleName="save-bar">
        {this.renderCancelButton()}
        {this.renderSaveButton()}
      </div>
    );
  }
}

const StyledActionBar = cssModules(SaveBar, styles);

class AnimatedActionBar extends Component {
  render() {
    const { hasCustomRoles, isEditMode } = this.props;
    return (
      <ConditionTransitionMotion
        condition={hasCustomRoles && isEditMode}
        willEnter={() => ({ bottom: -72 })}
        willLeave={() => ({ bottom: spring(-72) })}
        style={{ bottom: spring(0) }}
      >
        {style => <StyledActionBar {...this.props} style={style} />}
      </ConditionTransitionMotion>
    );
  }
}

export default customConnect({ mapStateToProps, mapDispatchToProps })(AnimatedActionBar);
