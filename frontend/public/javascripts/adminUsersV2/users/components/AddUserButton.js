import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { customConnect, I18nPropType } from 'common/connectUtils';
import AddUserModal from './AddUserModal';
import Button from 'common/components/Button';
import * as Actions from '../actions';

export class AddUserButton extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
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

export default customConnect({ mapDispatchToProps })(AddUserButton);
