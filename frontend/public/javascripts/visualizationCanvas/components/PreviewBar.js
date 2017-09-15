import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import I18n from 'common/i18n';
import { enterEditMode } from '../actions';

export class PreviewBar extends PureComponent {
  render() {
    const { onClickExit } = this.props;

    return (
      <div className="preview-bar">
        <button
          className="btn btn-transparent btn-back"
          onClick={onClickExit}
          aria-label={I18n.t('visualization_canvas.exit_preview_mode')}
          autoFocus>
          <span className="socrata-icon-arrow-prev" role="presentation" />
        </button>
        <span>{I18n.t('visualization_canvas.preview')}</span>
        <button
          className="btn btn-transparent btn-exit"
          onClick={onClickExit}
          aria-label={I18n.t('visualization_canvas.exit_preview_mode')}>
          <span className="socrata-icon-close-2" role="presentation" />
        </button>
      </div>
    );
  }
}

PreviewBar.propTypes = {
  onClickExit: PropTypes.func.isRequired
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ onClickExit: enterEditMode }, dispatch);
}

export default connect(_.stubObject, mapDispatchToProps)(PreviewBar);
