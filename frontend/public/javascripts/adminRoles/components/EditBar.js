import includes from 'lodash/fp/includes';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Button from 'common/components/Button';
import { customConnect, I18nPropType } from 'common/connectUtils';

import * as Actions from '../actions';
import * as Selectors from '../adminRolesSelectors';
import { DEFAULT, EDIT_CUSTOM_ROLES } from '../appStates';
import styles from './edit-bar.module.scss';

const mapStateToProps = state => {
  const appState = Selectors.getAppState(state);
  const hasCustomRoles = Selectors.stateHasCustomRoles(state);

  return {
    hasConfigurableRoleFeature: Selectors.currentUserHasFlag('admin') || Selectors.configurableRoleFeatureFlagFromState(state),
    isEditCustomRolesEnabled: hasCustomRoles && includes(appState, [DEFAULT]),
    isAddCustomRoleEnabled: includes(appState, [DEFAULT, EDIT_CUSTOM_ROLES]),
    faqUrl: Selectors.getFaqUrlFromState(state)
  };
};

const mapDispatchToProps = {
  newCustomRole: Actions.newCustomRole,
  startEditCustomRoles: Actions.editCustomRolesStart
};

class EditBar extends Component {
  static propTypes = {
    I18n: I18nPropType,
    isAddCustomRoleEnabled: PropTypes.bool.isRequired,
    isEditCustomRolesEnabled: PropTypes.bool.isRequired,
    startEditCustomRoles: PropTypes.func.isRequired,
    newCustomRole: PropTypes.func.isRequired,
    faqUrl: PropTypes.string
  };

  render() {
    const {
      I18n,
      isAddCustomRoleEnabled,
      isEditCustomRolesEnabled,
      hasConfigurableRoleFeature,
      startEditCustomRoles,
      newCustomRole,
      faqUrl
    } = this.props;

    return (
      <div styleName="edit-bar">
        {faqUrl ? (
          <a href={faqUrl} target="_blank" styleName="faq-button">
            <i className="socrata-icon-question" />
            {I18n.t('screens.admin.roles.index_page.faq_modal.title')}
          </a>
        ) : null}
        {hasConfigurableRoleFeature ? (
          <Button
            variant="default"
            buttonDisabledStyle="light"
            disabled={!isEditCustomRolesEnabled}
            onClick={startEditCustomRoles}
          >
            <i className="socrata-icon-edit" />
            {I18n.t('screens.admin.roles.buttons.edit_custom_roles')}
          </Button>
        ) : null}
        {hasConfigurableRoleFeature ? (
          <Button variant="primary" disabled={!isAddCustomRoleEnabled} onClick={newCustomRole}>
            <i className="socrata-icon-plus3" />
            {I18n.t('screens.admin.roles.buttons.new_custom_role')}
          </Button>
        ) : null}
      </div>
    );
  }
}

export default customConnect({ mapStateToProps, mapDispatchToProps, styles })(EditBar);
