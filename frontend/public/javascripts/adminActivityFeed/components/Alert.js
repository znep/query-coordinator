import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { dismissAlert } from '../actions';
import LocalizedText from 'common/i18n/components/LocalizedText';

class Alert extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !_.isNull(nextProps.alert);
  }

  componentDidMount() {
    setTimeout(this.props.dispatchDismissAlert, 3000);
  }

  render() {
    const { dispatchDismissAlert, alert } = this.props;
    const localeKey = `screens.admin.jobs.index_page.alerts.${alert.get('translationKey')}`;
    const alertData = alert.has('data') && alert.get('data') ? alert.get('data').toJS() : null;

    return (
      <div className='activity-feed-alert'>
        <div className={classNames('alert', alert.get('type'))}>
          <LocalizedText localeKey={localeKey} data={alertData}/>
          <i className='socrata-icon-close' onClick={dispatchDismissAlert}/>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  alert: state.get('alert')
});

const mapDispatchToProps = (dispatch) => ({
  dispatchDismissAlert: () => dispatch(dismissAlert())
});

export default connect(mapStateToProps, mapDispatchToProps)(Alert);
