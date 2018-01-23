import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import { MODES } from 'common/components/AccessManager/Constants';
import ModesPropType from 'common/components/AccessManager/propTypes/ModePropType';

import Header from './Header';
import Footer from './Footer';
import Errors from './Errors';
import ManageCollaborators from './ManageCollaborators';
import AudienceScopeChooser from './AudienceScopeChooser';
import ChangeOwner from './ChangeOwner';
import SuccessToastMessage from './SuccessToastMessage';
import styles from './access-manager.module.scss';


/**
 * This renders the header, any existing errors, and a different component depending on the "mode"
 *
 * The "visible" boolean on the state will change the class of this component to have
 * "display: none" if it is false; this is the mechanism used to show/hide the modal.
 */
class AccessManager extends Component {
  static propTypes = {
    errors: PropTypes.arrayOf(PropTypes.any),
    visible: PropTypes.bool.isRequired,
    mode: ModesPropType
  };

  static defaultProps = {
    errors: [],
    mode: null
  };

  renderCurrentMode = () => {
    const { mode } = this.props;

    switch (mode) {
      case MODES.CHANGE_OWNER:
        return (<ChangeOwner />);
      case MODES.PUBLISH:
      case MODES.CHANGE_AUDIENCE:
        return (<AudienceScopeChooser />);
      case MODES.MANAGE_COLLABORATORS:
        return (<ManageCollaborators />);
      default:
        return null;
    }
  }

  render() {
    const { visible, errors } = this.props;

    return (
      <div>
        <SuccessToastMessage />
        <div styleName={visible ? 'overlay' : 'overlay-hidden'}>
          <div styleName="modal">
            <div styleName="modal-content">
              <Header />
              <section>
                <Errors errors={errors} />
                {this.renderCurrentMode()}
              </section>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  visible: state.ui.visible,
  errors: state.ui.errors,
  mode: state.ui.mode
});

export default connect(mapStateToProps)(cssModules(AccessManager, styles));
