import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import cssModules from 'react-css-modules';
import I18n from '../../../../i18n';
import PermissionPropType from '../../propTypes/PermissionPropType';
import AccessSummaryFooter from './AccessSummaryFooter';
import { getAudienceScopeFromPermissions } from '../../Util';
import AudienceScopeLabel from '../AudienceScopeLabel';
import styles from './access-summary.scss';


/**
 * Shows a summary of the current permissions for a given asset.
 * That is, it's "audience" setting (public, private, etc.)
 * and all the users it has been shared to.
 */
class AccessSummary extends Component {
  static propTypes = {
    permissions: PropTypes.arrayOf(PermissionPropType),
    errors: PropTypes.arrayOf(PropTypes.any)
  };

  static defaultProps = {
    permissions: [],
    errors: []
  };

  renderBody = () => {
    const { permissions, errors } = this.props;
    const scope = getAudienceScopeFromPermissions(permissions);

    // if the "permissions" object exists, it means we've gotten back results from our API call
    if (permissions) {
      return (
        <div styleName="audience-container">
          <AudienceScopeLabel scope={scope} />
          <Link
            to="/scope"
            className="btn btn-default"
            styleName="change-audience-button">
            {I18n.t('shared.site_chrome.access_manager.change')}
          </Link>
        </div>
      );
    }

    // if there are errors, it means our api call failed
    if (errors && errors.length !== 0) {
      return null;
    } else {
      // no errors and no permissions; waiting for api call to finish
      return (
        <div styleName="spinner-container">
          <div className="spinner-default spinner-large" />
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        {this.renderBody()}
        <hr />
        <AccessSummaryFooter />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  permissions: state.accessManager.permissions,
  errors: state.accessManager.errors
});

export default
  connect(mapStateToProps)(cssModules(AccessSummary, styles));
