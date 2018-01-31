import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import styles from './myAlerts.module.scss';
import I18n from 'common/i18n';
import connectLocalization from 'common/i18n/components/connectLocalization';
import CreateAlertModal from 'common/components/CreateAlertModal';
import Spinner from '../../Spinner';
import MyAlertsApi from '../../../api/MyAlertsApi';

class MyAlerts extends Component {

  constructor() {
    super();

    this.state = {
      myAlerts: [],
      showEditAlertModal: false,
      isAlertsLoading: false,
      currentSelectedAlert: {},
      showDeleteMessage: false,
      showEmptyMessage: false
    };

    _.bindAll(this,
      'renderMyAlertList',
      'onEditButtonClick',
      'onCloseAlertModal',
      'fetchMyAlerts'
    );
  }

  componentWillMount() {
    this.fetchMyAlerts();
  }

  onCloseAlertModal(options) {
    let { showEditAlertModal, showDeleteMessage } = this.state;
    showDeleteMessage = _.get(options, 'isDeleted', false);
    showEditAlertModal = false;
    this.setState({ showEditAlertModal, showDeleteMessage });
    this.fetchMyAlerts();
  }

  onEditButtonClick(alert) {
    let { showEditAlertModal, currentSelectedAlert, showDeleteMessage } = this.state;

    showEditAlertModal = true;
    currentSelectedAlert = alert;
    showDeleteMessage = false;
    this.setState({ showEditAlertModal, currentSelectedAlert, showDeleteMessage });
  }

  fetchMyAlerts() {
    let myAlerts;
    let { showEmptyMessage, isAlertsLoading } = this.state;
    this.setState({ isAlertsLoading: true });
    MyAlertsApi.get().then((response) => {
      myAlerts = response;
      showEmptyMessage = _.isEmpty(response);
      isAlertsLoading = false;
      this.setState({ myAlerts, showEmptyMessage, isAlertsLoading });
    }).
    catch((error) => {
      this.setState({ isAlertsLoading: false });
    });
  }

  formatDatasetName(datasetName) {
    // sometimes datasetName may be null
    let name = (datasetName || '');
    name = name.replace(/[\W]/g, '-').replace(/\-+/g, '-');

    if (name.length < 1) {
      name = '-';
    }
    return name.slice(0, 50);
  }

  domainUrl(alert) {
    const domainName = _.get(alert, 'domain', '');
    const datasetId = _.get(alert, 'dataset_uid', '');
    const datasetName = _.get(alert, 'dataset_name', '');

    return (`//${domainName}/dataset/${this.formatDatasetName(datasetName)}/${datasetId}`);
  }
  renderMyAlertList() {
    const { myAlerts } = this.state;
    return myAlerts.map(alert =>
      <tr styleName="alert-row" key={alert.id}>
        <td>
          <span styleName="alert-name">{alert.name}</span>
          <a styleName="alert-dataset" href={this.domainUrl(alert)} target="_blank">
            {alert.dataset_name}
          </a>
          <span styleName="alert-query">{alert.query_string}</span>
        </td>
        <td styleName="edit-column">
          <div href onClick={() => this.onEditButtonClick(alert)}> Edit </div>
        </td>

      </tr>
    );
  }

  renderInfo() {
    const { showDeleteMessage, currentSelectedAlert, showEmptyMessage } = this.state;
    const { translationScope } = this.props;
    let deleteMessage = _.get(currentSelectedAlert, 'name', 'Alert');
    deleteMessage += ' ' + I18n.t('delete_message', { scope: translationScope });
    if (showDeleteMessage) {
      return (
        <div styleName="delete-info">
          <span>
            {deleteMessage}
          </span>
          <hr />
        </div>
      );
    } else if (showEmptyMessage) {
      return (
        <div styleName="delete-info">
          <span>
            {I18n.t('empty_message', { scope: translationScope })}
          </span>
          <hr />
        </div>
      );
    }
  }

  render() {
    const { isAlertsLoading, showEditAlertModal, currentSelectedAlert } = this.state;
    const { mapboxAccessToken } = this.props;
    let editAlertType = _.get(currentSelectedAlert, 'query_type', 'raw');
    const createAlertModal = (
      <CreateAlertModal
        alert={currentSelectedAlert}
        editAlertType={editAlertType}
        editMode={showEditAlertModal}
        mapboxAccessToken={mapboxAccessToken}
        onClose={this.onCloseAlertModal} />
    );
    return (
      <div styleName="my-alert-tab">
        {isAlertsLoading ? <Spinner /> : null}
        {this.renderInfo()}
        <div className="table-wrapper">
          <table className="table table-borderless table-condensed table-discrete">
            <tbody>
            {this.renderMyAlertList()}
            </tbody>
          </table>
        </div>
        {showEditAlertModal && createAlertModal}
      </div>
    );
  }
}

MyAlerts.defaultProps = {
  translationScope: 'shared_site_chrome_notifications.alert_setting_modal.my_alert_tab'
};

export default connectLocalization(cssModules(MyAlerts, styles, { allowMultiple: true }));
