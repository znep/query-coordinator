import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import I18n from 'common/i18n';
import { isUserRoled } from '../../common/user';
import { enterEditMode } from '../actions';
import { ModeStates } from '../lib/constants';
import ExportFlannel from 'common/components/ExportFlannel';

export class InfoPaneButtons extends PureComponent {

  constructor(props) {
    super(props);
  }

  render() {
    const { mode, onClickEdit } = this.props;

    const renderEditButton = () => {
      if (mode === ModeStates.VIEW && isUserRoled()) {
        return (
          <button className="btn btn-simple btn-sm btn-edit" onClick={onClickEdit}>
            {I18n.t('visualization_canvas.edit_visualization')}
          </button>
        );
      } else {
        return null;
      }
    };

    const flannelProps = Object.assign(
      {
        view: this.props.parentView,
        idFromView: false
      },
      this.props
    );

    return (
      <div className="btn-group">
        <ExportFlannel {...flannelProps} />
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
