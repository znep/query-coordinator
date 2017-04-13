import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';

import AppBar from './AppBar';
import NotificationList from './NotificationList';
import { setFourfour } from 'actions/routing';
import styles from 'styles/App.scss';

class App extends Component {
  componentDidMount() {
    const { dispatch, urlParams } = this.props;
    const { fourfour } = urlParams;

    dispatch(setFourfour(fourfour));
  }

  componentDidUpdate(prevProps) {
    const { dispatch } = this.props;
    const currentFourfour = _.get(this.props, 'params.fourfour', '');
    const prevFourfour = _.get(prevProps, 'params.fourfour', '');

    if (currentFourfour !== prevFourfour) {
      dispatch(setFourfour(currentFourfour));
    }
  }

  render() {
    const { children } = this.props;
    const classNames = `dataset-management-ui ${styles.datasetManagementUi}`;

    return (
      <div className={classNames}>
        <AppBar />
        {children}
        <NotificationList />
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.element,
  dispatch: PropTypes.func,
  urlParams: PropTypes.string
};

const mapStateToProps = (state, { params }) => ({
  urlParams: params
});

export default connect(mapStateToProps)(App);
