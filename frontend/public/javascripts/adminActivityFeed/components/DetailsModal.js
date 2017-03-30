import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {Modal, ModalHeader, ModalContent, ModalFooter} from 'socrata-components';

import connectLocalization from './Localization/connectLocalization';
import LocalizedDate from './Localization/LocalizedDate';
import LocalizedText from './Localization/LocalizedText';

class DetailsModal extends React.Component {

  renderDetails() {
    const {activity} = this.props;

    const status = _.snakeCase(activity.getIn(['data', 'status']));
    const type =  _.snakeCase(activity.getIn(['data', 'latest_event', 'event_type']));
    const translationPrefix = `show_page.event_messages.${status}.${type}`;
    const filename = activity.get('file_name') || <LocalizedText localeKey="show_page.file_name_unknown"/>;

    return (
      <ul>
        <li><span className="line-title">{activity.getIn(['data', 'activity_type'])}</span></li>
        <li>{activity.getIn(['dataset', 'name'])}</li>
        <li><LocalizedText localeKey={`${translationPrefix}.title`}/></li>
        <li><LocalizedText localeKey={`${translationPrefix}.description`} data={activity.getIn(['data', 'latest_event', 'info']).toJS()}/></li>
        <li><span className="line-title"><LocalizedText localeKey="initiated_at"/>:</span> {activity.getIn(['initiated_by', 'displayName'])}</li>
        <li><span className="line-title"><LocalizedText localeKey="started_by"/>:</span> <LocalizedDate withTime={true} date={activity.getIn(['data', 'created_at'])}/></li>
        <li><span className="line-title"><LocalizedText localeKey="import_method"/>:</span> {activity.getIn(['data', 'service'])}</li>
        <li>{filename}</li>
      </ul>
    );
  }

  render() {
    const {localization, dismissDetailsModal} = this.props;

    const modalProps = {
      fullScreen: false,
      onDismiss: dismissDetailsModal,
      className: 'details-modal'
    };
    const headerProps = {
      title: localization.translate('details'),
      onDismiss: dismissDetailsModal
    };

    return (
      <Modal {...modalProps} >
        <ModalHeader {...headerProps} />

        <ModalContent>
          {this.renderDetails()}
        </ModalContent>

        <ModalFooter>
          <div>
            <button className="btn btn-default" onClick={dismissDetailsModal}>
              <LocalizedText localeKey='close'/>
            </button>
          </div>
        </ModalFooter>
      </Modal>
    );
  }
}

const mapStateToProps = (state) => ({
  activity: state.get('detailsModal')
});
const mapDispatchToProps = (dispatch) => ({
  dismissDetailsModal: () => dispatch(actions.dismissDetailsModal())
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(DetailsModal));
