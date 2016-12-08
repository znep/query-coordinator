import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { translate as t } from '../lib/I18n';
import { enterEditMode } from '../actions';

export const PreviewBar = ({ onClickExit }) => (
  <div className="preview-bar">
    <button
      className="btn btn-transparent btn-back"
      href="#"
      onClick={onClickExit}
      aria-label={t('exit_preview_mode')}
      autoFocus>
      <span className="socrata-icon-arrow-prev" role="presentation" />
    </button>
    <span>{t('preview')}</span>
    <button
      className="btn btn-transparent btn-exit"
      href="#"
      onClick={onClickExit}
      aria-label={t('exit_preview_mode')}>
      <span className="socrata-icon-close-2" role="presentation" />
    </button>
  </div>
);

PreviewBar.propTypes = {
  onClickExit: PropTypes.func.isRequired
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ onClickExit: enterEditMode }, dispatch);
}

export default connect(_.stubObject, mapDispatchToProps)(PreviewBar);
