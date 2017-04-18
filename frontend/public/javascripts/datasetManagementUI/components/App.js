import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import AppBar from './AppBar';
import PublishingModal from './PublishingModal';
import NotificationList from './NotificationList';
import Modal from 'components/Modals/Modal';
import { setFourfour } from 'actions/routing';
import styles from 'styles/App.scss';

class App extends Component {
  componentWillReceiveProps(nextProps) {
    const { dispatch } = this.props;
    const oldFourfour = this.props.urlParams.fourfour;
    const newFourfour = nextProps.urlParams.fourfour;

    if (oldFourfour !== newFourfour) {
      dispatch(setFourfour(newFourfour));
    }
  }

  render() {
    const { children } = this.props;
    const wrapperClasses = `dataset-management-ui ${styles.datasetManagementUi}`;

    return (
      <div className={wrapperClasses}>
        <PublishingModal />
        <AppBar />
        {children}
        <NotificationList />
        <Modal />
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.element,
  dispatch: PropTypes.func,
  urlParams: PropTypes.shape({
    fourfour: PropTypes.string
  })
};

const mapStateToProps = (state, { params }) => ({
  urlParams: params
});

export default connect(mapStateToProps)(App);
