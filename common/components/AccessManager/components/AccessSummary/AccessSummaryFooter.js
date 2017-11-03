import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import I18n from '../../../../i18n';
import styles from './footer.scss';
import * as actions from '../../actions/AccessManagerActions';
import ButtonWithSpinner from '../ButtonWithSpinner';

/**
 * Footer that goes underneath the AccessSummary.
 *
 * This has the "Save" button that kicks off the saga
 * actually doing a POST of the data to persist the changed permissions.
 */
class AccessSummaryFooter extends Component {
  static propTypes = {
    onCancelClick: PropTypes.func.isRequired,
    onSaveClick: PropTypes.func.isRequired,
    errors: PropTypes.arrayOf(PropTypes.any)
  };

  static defaultProps = {
    errors: []
  };

  render() {
    const {
      errors,
      saveInProgress,
      onCancelClick,
      onSaveClick } = this.props;

    return (
      <footer styleName="footer">
        {/* Save button is disabled if we have any errors */}
        <ButtonWithSpinner
          showSpinner={saveInProgress}
          onClick={onSaveClick}
          disabled={errors && errors.length !== 0} >
          {I18n.t('shared.site_chrome.access_manager.save')}
        </ButtonWithSpinner>

        <button
          className="btn btn-default"
          styleName="button-cancel"
          onClick={onCancelClick}>
          {I18n.t('shared.site_chrome.access_manager.cancel')}
        </button>
      </footer>
    );
  }
}

const mapStateToProps = state => ({
  errors: state.accessManager.errors,
  saveInProgress: state.accessManager.saveInProgress
});

const mapDispatchToProps = dispatch => ({
  onCancelClick: () => dispatch(actions.cancelButtonClicked()),
  onSaveClick: () => dispatch(actions.saveButtonClicked())
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(AccessSummaryFooter, styles));
