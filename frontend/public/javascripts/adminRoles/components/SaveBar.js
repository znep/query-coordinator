import PropTypes from 'prop-types';
import React from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';
import { spring } from 'react-motion';
import includes from 'lodash/fp/includes';
import bindAll from 'lodash/fp/bindAll';

import { connectLocalization } from 'common/components/Localization';
import ConditionTransitionMotion from 'common/components/ConditionTransitionMotion';
import { editCustomRoles, saveRoles } from '../actions';
import { getAppState, getDirtyRolesFromState, stateHasCustomRoles } from '../adminRolesSelectors';
import { EDIT_CUSTOM_ROLES, SAVING, EDIT_INDIVIDUAL_CUSTOM_ROLE } from '../appStates';
import { Button } from 'common/components';
import styles from './save-bar.module.scss';

const mapStateToProps = state => {
  const appState = getAppState(state);
  const dirtyRoles = getDirtyRolesFromState(state);
  return {
    isEditMode: includes(appState, [EDIT_CUSTOM_ROLES, SAVING, EDIT_INDIVIDUAL_CUSTOM_ROLE]),
    isSaving: appState === SAVING,
    hasCustomRoles: stateHasCustomRoles(state),
    dirtyRoles,
    hasDirtyRoles: dirtyRoles.size
  };
};

const mapDispatchToProps = {
  cancelEditCustomRoles: () => editCustomRoles.cancel(),
  saveRoles: (roles) => saveRoles({ roles })
};

class SaveBar extends React.Component {
  constructor() {
    super();
    bindAll(['renderCancelButton', 'renderSaveButton'], this);
  }

  renderCancelButton() {
    const { cancelEditCustomRoles, isSaving, localization: { translate } } = this.props;

    return (
      <Button
        variant="primary"
        inverse={!isSaving}
        buttonDisabledStyle={'light'}
        disabled={isSaving}
        onClick={cancelEditCustomRoles}
      >
        {translate('screens.admin.roles.buttons.cancel')}
      </Button>
    );
  }

  renderSaveButton() {
    const { dirtyRoles, isSaving, saveRoles, localization: { translate } } = this.props;

    return (
      <Button
        variant="primary"
        busy={isSaving}
        styleName="save-button"
        onClick={() => saveRoles(dirtyRoles)}
        disabled={isSaving}
      >
        <div style={{ visibility: isSaving ? 'hidden' : 'inline' }}>
          {translate('screens.admin.roles.buttons.save')}
        </div>
        {isSaving &&
          <div styleName="spinner-container">
            <span className="spinner-default spinner-btn-primary" />
          </div>}
      </Button>
    );
  }

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

SaveBar.propTypes = {
  cancelEditCustomRoles: PropTypes.func.isRequired,
  dirtyRoles: PropTypes.object.isRequired,
  isSaving: PropTypes.bool.isRequired,
  saveRoles: PropTypes.func.isRequired,
  style: PropTypes.object.isRequired
};

const StyledActionBar = cssModules(SaveBar, styles);

class AnimatedActionBar extends React.Component {
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

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(AnimatedActionBar));
