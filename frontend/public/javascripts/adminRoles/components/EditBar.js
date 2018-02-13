import includes from 'lodash/fp/includes';
import PropTypes from 'prop-types';
import React from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';

import Button from 'common/components/Button';
import { connectLocalization } from 'common/components/Localization';

import * as Actions from '../actions';
import * as Selectors from '../adminRolesSelectors';
import { DEFAULT, EDIT_CUSTOM_ROLES } from '../appStates';
import styles from './edit-bar.module.scss';

const mapStateToProps = state => {
  const appState = Selectors.getAppState(state);
  const hasCustomRoles = Selectors.stateHasCustomRoles(state);

  return {
    hasConfigurableRoleFeature: Selectors.configurableRoleFeatureFlagFromState(state),
    isEditCustomRolesEnabled: hasCustomRoles && includes(appState, [DEFAULT]),
    isAddCustomRoleEnabled: includes(appState, [DEFAULT, EDIT_CUSTOM_ROLES]),
    faqUrl: Selectors.getFaqUrlFromState(state)
  };
};

const mapDispatchToProps = {
  newCustomRole: Actions.newCustomRole,
  startEditCustomRoles: Actions.editCustomRolesStart
};

class EditBar extends React.Component {
  static propTypes = {
    isAddCustomRoleEnabled: PropTypes.bool.isRequired,
    isEditCustomRolesEnabled: PropTypes.bool.isRequired,
    startEditCustomRoles: PropTypes.func.isRequired,
    newCustomRole: PropTypes.func.isRequired,
    faqUrl: PropTypes.string
  };

  render() {
    const {
      isAddCustomRoleEnabled,
      isEditCustomRolesEnabled,
      hasConfigurableRoleFeature,
      startEditCustomRoles,
      newCustomRole,
      faqUrl,
      localization: { translate }
    } = this.props;

    return (
      <div styleName="edit-bar">
        {faqUrl ? (
          <a href={faqUrl} target="_blank" styleName="faq-button">
            <i className="socrata-icon-question" />
            {translate('screens.admin.roles.index_page.faq_modal.title')}
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
            {translate('screens.admin.roles.buttons.edit_custom_roles')}
          </Button>
        ) : null}
        {hasConfigurableRoleFeature ? (
          <Button variant="primary" disabled={!isAddCustomRoleEnabled} onClick={newCustomRole}>
            <i className="socrata-icon-plus3" />
            {translate('screens.admin.roles.buttons.new_custom_role')}
          </Button>
        ) : null}
      </div>
    );
  }
}

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(cssModules(EditBar, styles)));
