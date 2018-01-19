import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect as fullConnect } from '../../utils';
import AddUserModal from './AddUserModal';
import Button from 'common/components/Button';
import * as Actions from '../actions';

export class AddUserButton extends Component {
  static propTypes = {
    addUsers: PropTypes.func.isRequired
  };

  render() {
    const { I18n, addUsers } = this.props;
    return (
      <div className="add-user-button-container">
        <Button variant="primary" className="add-user-button" onClick={addUsers}>
          {I18n.t('users.add_new_users.add_users')}
        </Button>
        <AddUserModal />
      </div>
    );
  }
}


const mapDispatchToProps = ({
  addUsers: Actions.addUsers
});

export default fullConnect(null, mapDispatchToProps)(AddUserButton);
