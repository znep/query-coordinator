import PropTypes from 'prop-types';
import React from 'react';
import cssModules from 'react-css-modules';
import styles from './edit-bar.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { editCustomRoles, newCustomRole } from '../actions';
import {
  configurableRoleFeatureFlagFromState,
  getAppState,
  getFaqUrlFromState,
  stateHasCustomRoles
} from '../selectors';
import { DEFAULT, EDIT_CUSTOM_ROLES } from '../appStates';
import includes from 'lodash/fp/includes';
import SocrataButton from './util/SocrataButton';
import { connectLocalization } from 'common/components/Localization';

const mapStateToProps = state => {
  const appState = getAppState(state);
  const hasCustomRoles = stateHasCustomRoles(state);

  return {
    hasConfigurableRoleFeature: configurableRoleFeatureFlagFromState(state),
    isEditCustomRolesEnabled: hasCustomRoles && includes(appState, [DEFAULT]),
    isAddCustomRoleEnabled: includes(appState, [DEFAULT, EDIT_CUSTOM_ROLES]),
    faqUrl: getFaqUrlFromState(state)
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      newCustomRole,
      startEditCustomRoles: editCustomRoles.start
    },
    dispatch
  );

class EditBar extends React.Component {
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
        {faqUrl
          ? <a href={faqUrl} target="_blank" styleName="faq-button">
              <i className="socrata-icon-question" />
              {translate('screens.admin.roles.index_page.faq_modal.title')}
            </a>
          : null}
        {hasConfigurableRoleFeature
          ? <SocrataButton
              buttonType="default"
              buttonDisabledStyle="light"
              disabled={!isEditCustomRolesEnabled}
              onClick={() => startEditCustomRoles()}
            >
              <i className="socrata-icon-edit" />
              {translate('screens.admin.roles.buttons.edit_custom_roles')}
            </SocrataButton>
          : null}
        {hasConfigurableRoleFeature
          ? <SocrataButton
              buttonType="primary"
              disabled={!isAddCustomRoleEnabled}
              onClick={() => newCustomRole()}
            >
              <i className="socrata-icon-plus3" />
              {translate('screens.admin.roles.buttons.new_custom_role')}
            </SocrataButton>
          : null}
      </div>
    );
  }
}

EditBar.propTypes = {
  isAddCustomRoleEnabled: PropTypes.bool.isRequired,
  isEditCustomRolesEnabled: PropTypes.bool.isRequired,
  startEditCustomRoles: PropTypes.func.isRequired,
  newCustomRole: PropTypes.func.isRequired,
  faqUrl: PropTypes.string
};

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(cssModules(EditBar, styles)));
