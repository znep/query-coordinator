import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';
import Button from 'common/components/Button';

import * as uiActions from 'common/components/AccessManager/actions/UiActions';

import FooterConfirmButton from './FooterConfirmButton';
import styles from './footer.module.scss';

class Footer extends Component {
  static propTypes = {
    cancelButtonText: PropTypes.string,
    showCancelButton: PropTypes.bool,
    onCancelClick: PropTypes.func.isRequired,
    confirmButtonBusy: PropTypes.bool
  }

  static defaultProps = {
    cancelButtonText: I18n.t('shared.site_chrome.access_manager.cancel'),
    showCancelButton: true,
    confirmButtonBusy: false
  }

  render() {
    const {
      cancelButtonText,
      onCancelClick,
      showCancelButton,
      confirmButtonBusy
    } = this.props;

    return (
      <footer styleName="footer-container">
        {showCancelButton &&
          (<Button
            disabled={confirmButtonBusy}
            onClick={() => onCancelClick()}
            styleName="cancel-button">
            {cancelButtonText}
          </Button>)
        }
        <FooterConfirmButton />
      </footer>
    );
  }
}

const mapStateToProps = state => ({
  cancelButtonText: state.ui.footer.cancelButtonText,
  showCancelButton: state.ui.footer.showCancelButton,
  confirmButtonBusy: state.ui.saveInProgress
});

const mapDispatchToProps = dispatch => ({
  onCancelClick: () => dispatch(uiActions.cancelButtonClicked())
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Footer, styles));
