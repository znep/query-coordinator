import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { SocrataIcon } from 'common/components';
import I18n from 'common/i18n';
import { SaveStates } from '../lib/constants';
import { save, clearSaveState } from '../actions';

export class SaveNotification extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'renderDismissButton'
    ]);
  }

  renderDismissButton() {
    const { dismiss } = this.props;

    const buttonProps = {
      className: 'btn btn-transparent btn-dismiss',
      'aria-label': I18n.t('visualization_canvas.dismiss'),
      onClick: dismiss
    };

    return (
      <button {...buttonProps}>
        <SocrataIcon name="close-2" />
      </button>
    );
  }

  render() {
    const { saveState, retry } = this.props;
    let content;

    switch (saveState) {
      case SaveStates.ERRORED:
        content = (
          <div className="alert-overlay">
            <div className="alert error">
              {I18n.t('visualization_canvas.save_error')}
              <button className="btn btn-transparent btn-retry" onClick={retry}>
                {I18n.t('visualization_canvas.save_error_retry_prompt')}
              </button>
              {this.renderDismissButton()}
            </div>
          </div>
        );
        break;

      case SaveStates.SAVED:
        content = (
          <div className="alert success">
            {I18n.t('visualization_canvas.save_success')}
            {this.renderDismissButton()}
          </div>
        );
        break;

      default:
        return null;
    }

    return (
      <div className="save-notification">
        {content}
      </div>
    );
  }
}

SaveNotification.propTypes = {
  dismiss: PropTypes.func,
  retry: PropTypes.func,
  saveState: PropTypes.oneOf(_.values(SaveStates)).isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'saveState');
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    retry: save,
    dismiss: clearSaveState
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SaveNotification);
