import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import { createMemoryHistory, Router } from 'react-router';
import styles from './access-manager.scss';
import Header from './Header';
import Errors from './Errors';
import AccessSummary from './AccessSummary';
import AudienceScopeChooser from './AudienceScopeChooser';

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
    visible: PropTypes.bool.isRequired,
    errors: PropTypes.arrayOf(PropTypes.any)
  };

  static defaultProps = {
    errors: []
  };

  // Routes are pulled out like this because sometimes
  // the component will re-render and react-router will
  // complain that we're trying to re-set the routes.
  // With them static like this, react doesn't try to do
  // anything when it re-renders the component.
  static routes = [
    {
      path: '/',
      component: AccessSummary
    },
    {
      path: '/scope',
      component: AudienceScopeChooser
    }
  ];

  constructor(props) {
    super(props);

    // We use a memory history here since we don't want the URL to change.
    // Essentially, we're using react-router as an easy way to switch
    // between various components.
    this.history = createMemoryHistory();
  }

  render() {
    const { visible, errors } = this.props;

    return (
      <div styleName={visible ? 'overlay' : 'overlay-hidden'}>
        <div styleName="modal">
          <Header />
          <section>
            <Errors errors={errors} />
            <Router history={this.history} routes={AccessManager.routes} />
          </section>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  visible: state.accessManager.visible,
  errors: state.accessManager.errors
});

export default connect(mapStateToProps)(cssModules(AccessManager, styles));
