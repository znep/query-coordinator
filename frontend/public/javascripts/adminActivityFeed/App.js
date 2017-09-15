import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import EmptyState from './components/EmptyState';
import Alert from './components/Alert';
import RestoreModal from './components/RestoreModal';
import DetailsModal from './components/DetailsModal';
import ActivityFeedTable from './components/ActivityFeedTable';
import FilterBar from './components/FilterBar/FilterBar';
import LoadingSpinner from './components/LoadingSpinner';

import './App.scss';

class App extends React.Component {
  render() {
    const alert = this.props.alert ? <Alert /> : null;
    const detailsModal = this.props.detailsModal ? <DetailsModal /> : null;
    const restoreModal = this.props.restoreModal ? <RestoreModal /> : null;
    const loadingSpinner = this.props.loading ? <LoadingSpinner /> : null;
    const filterBar = this.props.hasFilterBar ? <FilterBar /> : null;

    return (
      <div>
        {loadingSpinner}
        {alert}
        {detailsModal}
        {restoreModal}
        {filterBar}
        <ActivityFeedTable />
        <EmptyState />
      </div>
    );
  }
}

App.propTypes = {
  hasFilterBar: PropTypes.bool.isRequired
};

const mapStateToProps = (state) => ({
  loading: state.get('loading'),
  alert: state.get('alert'),
  detailsModal: state.get('detailsModal'),
  restoreModal: state.get('restoreModal')
});

export default connect(mapStateToProps, null)(App);
