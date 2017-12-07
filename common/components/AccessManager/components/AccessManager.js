import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import { createMemoryHistory, Router } from 'react-router';

import I18n from 'common/i18n';

import styles from './access-manager.scss';
import Header from './Header';
import Errors from './Errors';
import AccessSummary from './AccessSummary';
import AudienceScopeChooser from './AudienceScopeChooser';
import ChangeOwner from './ChangeOwner';
import * as uiActions from '../actions/UiActions';

/**
 * This renders the header, any existing errors, and a react-router'd set of components.
 *
 * react-router's "memory history" is used here, so the URL isn't actually being changed.
 *
 * The "visible" boolean on the state will change the class of this component to have
 * "display: none" if it is false; this is the mechanism used to show/hide the modal.
 */
class AccessManager extends Component {
  static propTypes = {
    changeHeader: PropTypes.func.isRequired,
    errors: PropTypes.arrayOf(PropTypes.any),
    visible: PropTypes.bool.isRequired
  };

  static defaultProps = {
    errors: []
  };

  constructor(props) {
    super(props);

    // We use a memory history here since we don't want the URL to change.
    // Essentially, we're using react-router as an easy way to switch
    // between various components.
    this.history = createMemoryHistory();
  }

  routes = [
    {
      path: '/',
      component: AccessSummary,
      onEnter: () => this.props.changeHeader(
        I18n.t('shared.site_chrome.access_manager.summary.title'),
        I18n.t('shared.site_chrome.access_manager.summary.subtitle')
      )
    },
    {
      path: '/scope',
      component: AudienceScopeChooser,
      onEnter: () => this.props.changeHeader(
        I18n.t('shared.site_chrome.access_manager.change_scope.title'),
        I18n.t('shared.site_chrome.access_manager.change_scope.subtitle')
      )
    },
    {
      path: '/change_owner',
      component: ChangeOwner,
      onEnter: () => this.props.changeHeader(
        I18n.t('shared.site_chrome.access_manager.change_owner.title'),
        I18n.t('shared.site_chrome.access_manager.change_owner.subtitle')
      )
    }
  ];

  render() {
    const { visible, errors } = this.props;

    return (
      <div styleName={visible ? 'overlay' : 'overlay-hidden'}>
        <div styleName="modal">
          <Header />
          <section>
            <Errors errors={errors} />
            <Router history={this.history} routes={this.routes} />
          </section>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  visible: state.ui.visible,
  errors: state.ui.errors
});

const mapDispatchToProps = dispatch => ({
  changeHeader: (title, subtitle) => dispatch(uiActions.changeHeader(title, subtitle))
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(AccessManager, styles));
