import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { openEditMultipleItemsModal } from '../actions/bulkEditActions';
import { downloadCsvExportData, cancelCsvExportData } from '../actions/dataExportActions';
import translator from '../helpers/translator';

import SocrataFlannel from '../components/SocrataFlannel';
import SocrataButton from '../components/SocrataButton';
import SocrataDownloadButton from '../components/SocrataDownloadButton/SocrataDownloadButton';

class SocrataBulkActions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showDownloadInfoBox: false,
      infoBoxFor: null
    };

    _.bindAll(this, 'handleInfoBoxDismiss', 'handleDownloadCsv', 'handleCancelCsv');
  }

  handleInfoBoxDismiss() {
    this.setState({ showDownloadInfoBox: false });
  }

  handleDownloadCsv() {
    this.setState({
      showDownloadInfoBox: true,
      infoBoxFor: 'Csv'
    });

    this.props.downloadCsv();
  }

  handleCancelCsv() {
    this.setState({
      showDownloadInfoBox: false
    });

    this.props.cancelDownloadCsv();
  }

  componentDidUpdate() {
    const infoBox = ReactDOM.findDOMNode(this.refs.infoBox);
    const csv = ReactDOM.findDOMNode(this.refs.csv);

    if (!infoBox) {
      return;
    }

    const csvLeft = csv.offsetLeft;
    const csvWidth = csv.offsetWidth;
    const csvBottom = csv.offsetTop + csv.offsetHeight;

    const infoBoxWidth = infoBox.offsetWidth;

    infoBox.style.left = `${csvLeft + csvWidth - infoBoxWidth - 15}px`;
    infoBox.style.top = `${csvBottom}px`;
  }

  renderDownloadInfoBox() {
    const { translations } = this.props;
    const { showDownloadInfoBox, infoBoxFor } = this.state;


    if (showDownloadInfoBox) {
      const inProgress = this.props[`${infoBoxFor.toLowerCase()}Export`].inProgress;
      const infoTitle = translator(translations, `admin.export.${infoBoxFor}.info_title`);
      const infoDescription = translator(translations, `admin.export.${infoBoxFor}.info_description`);

      return inProgress && (
        <SocrataFlannel ref="infoBox"
                        onDismiss={ this.handleInfoBoxDismiss }
                        title={infoTitle}
                        content={infoDescription}
                        onCancel={ this[`handleCancel${infoBoxFor}`] }/>
      );
    }
  }

  render() {
    const { csvExport, translations, openBulkEditModal, selectedRowsCount } = this.props;

    const editTitle = translator(translations, 'admin.bulk_edit.button_title');
    const csvExportTitle = translator(translations, 'admin.export.Csv.button_label');

    return (
      <div className="bulk-actions">
        <div className="btn-group">
          <SocrataButton simple disabled={ selectedRowsCount < 2 } onClick={ openBulkEditModal }>
            { editTitle }
          </SocrataButton>

          <SocrataDownloadButton ref="csv"
                                 simple
                                 fileName="goals.csv"
                                 fileUrl="/api/stat/v1/goals/list.csv"
                                 inProgress={csvExport.inProgress}
                                 onStartDownload={this.handleDownloadCsv}>
            { csvExportTitle }
          </SocrataDownloadButton>
        </div>
        { this.renderDownloadInfoBox() }
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  selectedRowsCount: state.getIn(['goalTableData', 'selectedRows']).count(),
  csvExport: state.getIn(['dataExport', 'csv']).toJS()
});

const mapDispatchToProps = dispatch => ({
  openBulkEditModal: () => dispatch(openEditMultipleItemsModal()),
  downloadCsv: () => dispatch(downloadCsvExportData()),
  cancelDownloadCsv: () => dispatch(cancelCsvExportData())
});

export default connect(mapStateToProps, mapDispatchToProps)(SocrataBulkActions);
