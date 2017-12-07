import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import connectLocalization from 'common/i18n/components/connectLocalization';
import AddUserModal from './AddUserModal';
import _ from 'lodash';
import { toggleAddUserUi } from '../actions';

export class AddUserButton extends Component {
  render() {
    const { I18n, onStartAddUser } = this.props;
    return (
      <div className="add-user-button-container">
        <button type="button" className="add-user-button btn btn-primary" onClick={() => onStartAddUser()}>
          {I18n.translate('users.add_new_users.add_users')}
        </button>
        <AddUserModal />
      </div>
    );
  }
}

AddUserButton.propTypes = {
  onStartAddUser: PropTypes.func.isRequired
};

const mapDispatchToProps = dispatch => ({
  onStartAddUser: () => {
    dispatch(toggleAddUserUi(true));
  }
});

const ConnectedAddUserButton = connectLocalization(
  connect(_.constant({}), mapDispatchToProps)(AddUserButton)
);
export default ConnectedAddUserButton;