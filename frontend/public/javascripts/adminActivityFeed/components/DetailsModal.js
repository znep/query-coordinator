import _ from 'lodash';
import {Map} from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {dismissDetailsModal} from '../actions';
import {Modal, ModalHeader, ModalContent, ModalFooter} from 'common/components';
import JSONPretty from 'react-json-pretty';
import I18n from 'common/i18n';
import LocalizedDate from 'common/i18n/components/LocalizedDate';
import LocalizedText from 'common/i18n/components/LocalizedText';

class DetailsModal extends React.Component {

  shouldComponentUpdate(nextProps) {
    return !_.isNull(nextProps.activity);
  }

  renderNameLine() {
    const {activity} = this.props;

    const datasetName = activity.get('dataset') ?
      activity.getIn(['dataset', 'name']) :
      <LocalizedText localeKey='screens.admin.jobs.index_page.deleted_dataset'/>;

    const filename = activity.getIn(['data', 'activity_name']) ?
      `(${activity.getIn(['data', 'activity_name'])})` :
      <LocalizedText localeKey='screens.admin.jobs.show_page.file_name_unknown'/>;

    return (
      <li id='line-activity-name'>
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
        <span className='line-title'><LocalizedText localeKey='screens.admin.jobs.show_page.failed_rows'/>: </span>
        <a href={errorsDownloadUrl}>errors.csv</a>
      </li>
    );
  }

  renderEventMessage() {
    const {activity} = this.props;

    const eventType = activity.getIn(['data', 'latest_event', 'event_type']);
    const status = _.snakeCase(activity.getIn(['data', 'latest_event', 'status']));
    const type = eventType ? eventType.replace(/-/g, '_') : 'generic';
    const eventInfo = (activity.getIn(['data', 'latest_event', 'info']) || new Map()).toJS();

    const titleTranslationKey = I18n.
      lookup(`screens.admin.jobs.show_page.event_messages.${status}.${type}.title`) ?
        `screens.admin.jobs.show_page.event_messages.${status}.${type}.title` :
        'screens.admin.jobs.show_page.fallback_event_title';

    const description = I18n.
      lookup(`screens.admin.jobs.show_page.event_messages.${status}.${type}.description`) ?
        (
          <LocalizedText
            localeKey={`screens.admin.jobs.show_page.event_messages.${status}.${type}.description`}
            data={eventInfo} />
        ) :
        <JSONPretty json={eventInfo} />;

    return (
      <div>
        <li id='line-activity-event-title'>
          <LocalizedText
            localeKey={titleTranslationKey}
            data={{error_code: type}}
            className='line-title' />
        </li>
        <li id='line-activity-event-desc'>
          {description}
        </li>
      </div>
    );
  }

  renderDetails() {
    const {activity} = this.props;

    const serviceNameLocaleKey = `screens.admin.jobs.show_page.services.${activity.getIn(['data', 'service'])}`;

    return (
      <ul>
        <li id='line-activity-type'>
          <LocalizedText
            localeKey={`screens.admin.jobs.actions.${_.lowerCase(activity.getIn(['data', 'activity_type']))}`}
            className='line-title' />
        </li>
        {this.renderNameLine()}
        {this.renderEventMessage()}
        <li id='line-activity-started-by'>
          <span className='line-title'><LocalizedText localeKey='screens.admin.jobs.started_by'/>: </span>
          {activity.getIn(['initiated_by', 'displayName'])}
        </li>
        <li id='line-activity-initiated-at'>
          <span className='line-title'><LocalizedText localeKey='screens.admin.jobs.initiated_at'/>: </span>
          <LocalizedDate withTime date={activity.getIn(['data', 'created_at'])}/>
        </li>
        <li id='line-activity-import-method'>
          <span className='line-title'><LocalizedText localeKey='screens.admin.jobs.import_method'/>: </span>
          <LocalizedText localeKey={serviceNameLocaleKey}/>
        </li>
        {this.renderErrorsDownloadLink()}
      </ul>
    );
  }

  render() {
    const {dispatchDismissDetailsModal} = this.props;

    const modalProps = {
      fullScreen: false,
      onDismiss: dispatchDismissDetailsModal,
      className: 'details-modal'
    };
    const headerProps = {
      title: I18n.t('screens.admin.jobs.details'),
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
            <button className='btn btn-default' onClick={dispatchDismissDetailsModal}>
              <LocalizedText localeKey='screens.admin.jobs.close'/>
            </button>
          </div>
        </ModalFooter>
      </Modal>
    );
  }
}

DetailsModal.propTypes = {
  activity: PropTypes.object,
  dispatchDismissDetailsModal: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  activity: state.get('detailsModal', null)
});
const mapDispatchToProps = (dispatch) => ({
  dispatchDismissDetailsModal: () => dispatch(dismissDetailsModal())
});

export default connect(mapStateToProps, mapDispatchToProps)(DetailsModal);
