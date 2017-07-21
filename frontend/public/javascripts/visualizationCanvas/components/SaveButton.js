import _ from 'lodash';
import React, { PropTypes, PureComponent } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { save } from '../actions';
import { SaveStates } from '../lib/constants';

export class SaveButton extends PureComponent {
  render() {
    const { isDirty, saveState, onClick } = this.props;
    const isSaving = saveState === SaveStates.SAVING;

    const classes = classNames('btn btn-dark btn-default btn-save', {
      'btn-busy': isSaving
    });

    const buttonProps = {
      className: classes,
      disabled: !isDirty,
      onClick
    };

    const buttonContents = isSaving ?
      <span className="spinner-default spinner-dark" aria-label={I18n.t('visualization_canvas.saving')} /> :
      I18n.t('visualization_canvas.save');

    return <button {...buttonProps}>{buttonContents}</button>;
  }
}

SaveButton.propTypes = {
  isDirty: PropTypes.bool.isRequired,
  saveState: PropTypes.oneOf(_.values(SaveStates)),
  onClick: PropTypes.func
};

function mapStateToProps(state) {
  return _.pick(state, 'isDirty', 'saveState');
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ onClick: save }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SaveButton);
