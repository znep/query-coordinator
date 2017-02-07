import _ from 'lodash';
import React, { PropTypes, PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { t } from '../lib/I18n';
import { isUserAdminOrPublisher } from '../../common/user';
import { enterEditMode } from '../actions';
import { ModeStates } from '../lib/constants';

export class InfoPaneButtons extends PureComponent {
  render() {
    const { mode, onClickEdit } = this.props;

    const renderEditButton = () => {
      if (mode === ModeStates.VIEW && isUserAdminOrPublisher()) {
        return (
          <button className="btn btn-simple btn-sm btn-edit" onClick={onClickEdit}>
            {t('edit_visualization')}
          </button>
        );
      } else {
        return null;
      }
    };

    return (
      <div className="btn-group">
        {renderEditButton()}
      </div>
    );
  }
}

InfoPaneButtons.propTypes = {
  mode: PropTypes.string.isRequired,
  onClickEdit: PropTypes.func
};

function mapStateToProps(state) {
  return _.pick(state, 'mode');
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ onClickEdit: enterEditMode }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(InfoPaneButtons);
