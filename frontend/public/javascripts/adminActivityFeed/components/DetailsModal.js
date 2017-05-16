import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {dismissDetailsModal} from '../actions';
import {Modal, ModalHeader, ModalContent, ModalFooter} from 'socrata-components';

import connectLocalization from './Localization/connectLocalization';
import LocalizedDate from './Localization/LocalizedDate';
import LocalizedText from './Localization/LocalizedText';

class DetailsModal extends React.Component {

  shouldComponentUpdate(nextProps) {
    return !_.isNull(nextProps.activity);
  }

  renderNameLine() {
    const {activity} = this.props;

    let filename;
    if (activity.get('file_name')) {
      filename = `(${activity.get('file_name')})`;
    }

    return (
      <li id="line-activity-name">
        {activity.getIn(['dataset', 'name'])}{filename}
      </li>
    );
  }

  renderErrorsDownloadLink() {
    const {activity} = this.props;

    const errorsDownloadUrl = activity.get('bad_rows_url');
    if (!errorsDownloadUrl) {
      return null;
    }

    return (
      <li id="line-activity-bad-rows">
        <a href={errorsDownloadUrl}>errors.csv</a>
      </li>
    );
  }

  renderDetails() {
    const {activity} = this.props;

    const status = _.snakeCase(activity.getIn(['data', 'status']));
    const type =  _.snakeCase(activity.getIn(['data', 'latest_event', 'event_type']));

    return (
      <ul>
        <li id="line-activity-type">
          <span className="line-title">{activity.getIn(['data', 'activity_type'])}</span>
        </li>
        {this.renderNameLine()}
        <li id="line-activity-event-title">
          <LocalizedText localeKey={`show_page.event_messages.${status}.${type}.title`}/>
        </li>
        <li id="line-activity-event-desc">
          <LocalizedText
            localeKey={`show_page.event_messages.${status}.${type}.description`}
            data={activity.getIn(['data', 'latest_event', 'info']).toJS()}
          />
        </li>
        <li id="line-activity-started-by">
          <span className="line-title"><LocalizedText localeKey="started_by"/>: </span>
          {activity.getIn(['initiated_by', 'displayName'])}
        </li>
        <li id="line-activity-initiated-at">
          <span className="line-title"><LocalizedText localeKey="initiated_at"/>: </span>
          <LocalizedDate withTime={true} date={activity.getIn(['data', 'created_at'])}/>
        </li>
        <li id="line-activity-import-method">
          <span className="line-title"><LocalizedText localeKey="import_method"/>: </span>
          {activity.getIn(['data', 'service'])}
        </li>
        {this.renderErrorsDownloadLink()}
      </ul>
    );
  }

  render() {
    const {localization, dispatchDismissDetailsModal} = this.props;

    const modalProps = {
      fullScreen: false,
      onDismiss: dispatchDismissDetailsModal,
      className: 'details-modal'
    };
    const headerProps = {
      title: localization.translate('details'),
      onDismiss: dispatchDismissDetailsModal
    };

    return (
      <Modal {...modalProps} >
        <ModalHeader {...headerProps} />

        <ModalContent>
          {this.renderDetails()}
        </ModalContent>

        <ModalFooter>
          <div>
            <button className="btn btn-default" onClick={dispatchDismissDetailsModal}>
              <LocalizedText localeKey='close'/>
            </button>
          </div>
        </ModalFooter>
      </Modal>
    );
  }
}

DetailsModal.propTypes = {
  activity: React.PropTypes.object,
  localization: React.PropTypes.object.isRequired,
  dispatchDismissDetailsModal: React.PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  activity: state.get('detailsModal', null)
});
const mapDispatchToProps = (dispatch) => ({
  dispatchDismissDetailsModal: () => dispatch(dismissDetailsModal())
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(DetailsModal));
