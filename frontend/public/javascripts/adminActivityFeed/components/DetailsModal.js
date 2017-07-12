import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {dismissDetailsModal} from '../actions';
import {Modal, ModalHeader, ModalContent, ModalFooter} from 'common/components';

import connectLocalization from './Localization/connectLocalization';
import LocalizedDate from './Localization/LocalizedDate';
import LocalizedText from './Localization/LocalizedText';

class DetailsModal extends React.Component {

  shouldComponentUpdate(nextProps) {
    return !_.isNull(nextProps.activity);
  }

  renderNameLine() {
    const {activity} = this.props;

    const datasetName = activity.get('dataset') ?
      activity.getIn(['dataset', 'name']) :
      <LocalizedText localeKey="index_page.deleted_dataset"/>;

    const filename = activity.getIn(['data', 'activity_name']) ?
      `(${activity.getIn(['data', 'activity_name'])})` :
      <LocalizedText localeKey="show_page.file_name_unknown"/>;

    return (
      <li id="line-activity-name">
        {datasetName} {filename}
      </li>
    );
  }

  renderErrorsDownloadLink() {
    const {activity} = this.props;

    const errorsDownloadUrl = activity.getIn(['data', 'latest_event', 'info', 'badRowsPath']);
    if (!errorsDownloadUrl) {
      return null;
    }

    return (
      <li id="line-activity-bad-rows">
        <span className="line-title"><LocalizedText localeKey="show_page.failed_rows"/>: </span>
        <a href={errorsDownloadUrl}>errors.csv</a>
      </li>
    );
  }

  renderDetails() {
    const {activity} = this.props;

    const status = _.snakeCase(activity.getIn(['data', 'latest_event', 'status']));
    const eventType = activity.getIn(['data', 'latest_event', 'event_type']);
    const type = eventType ? eventType.replace(/-/g, '_') : 'generic';
    const eventInfo = activity.getIn(['data', 'latest_event', 'info']);
    const serviceNameLocaleKey = `show_page.services.${activity.getIn(['data', 'service'])}`;

    return (
      <ul>
        <li id="line-activity-type">
          <span className="line-title">{activity.getIn(['data', 'activity_type'])}</span>
        </li>
        {this.renderNameLine()}
        <li id="line-activity-event-title">
          <span className="line-title">
            <LocalizedText localeKey={`show_page.event_messages.${status}.${type}.title`}/>
          </span>
        </li>
        <li id="line-activity-event-desc">
          <LocalizedText
            localeKey={`show_page.event_messages.${status}.${type}.description`}
            data={eventInfo ? eventInfo.toJS() : {}}
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
          <LocalizedText localeKey={serviceNameLocaleKey}/>
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
