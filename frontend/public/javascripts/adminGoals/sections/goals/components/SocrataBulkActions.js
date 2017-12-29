import _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom'; // eslint-disable-line no-unused-vars
import * as ReactRedux  from 'react-redux';

import { Button } from 'common/components';

import * as Components from '../../../components';
import * as Actions from '../actions';
import * as Helpers from '../../../helpers';
import * as State from '../state';
import * as Selectors from '../selectors';
import * as Constants from '../constants';

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

    this.props.downloadCsv(this.props.csvUrl);
  }

  handleCancelCsv() {
    this.setState({
      showDownloadInfoBox: false
    });

    this.props.cancelDownloadCsv();
  }

  componentDidMount() {
    this.csvButton = this.refs.csv;
  }

  renderDownloadInfoBox() {
    const { translations } = this.props;
    const { showDownloadInfoBox, infoBoxFor } = this.state;


    if (showDownloadInfoBox) {
      const inProgress = this.props[`${infoBoxFor.toLowerCase()}Export`].inProgress;
      const infoTitle = Helpers.translator(translations, `admin.export.${infoBoxFor}.info_title`);
      const infoDescription = Helpers.translator(translations, `admin.export.${infoBoxFor}.info_description`);
      const ok = Helpers.translator(translations, 'admin.export.info_box.ok');
      const cancel = Helpers.translator(translations, 'admin.export.info_box.cancel');

      return inProgress ? (
        <Components.Socrata.Flannel.Wrapper ref="infoBox" hoverable={this.csvButton} closeFlannel={ this.handleInfoBoxDismiss }>
          <Components.Socrata.Flannel.Header title={infoTitle} />
          <Components.Socrata.Flannel.Content>
            <p className="small" dangerouslySetInnerHTML={ { __html: infoDescription } }/>
          </Components.Socrata.Flannel.Content>
          <Components.Socrata.Flannel.Footer>
            <Button variant="primary" onClick={ this.handleInfoBoxDismiss }>
              {ok}
            </Button>
            <Button onClick={ this[`handleCancel${infoBoxFor}`] }>
              {cancel}
            </Button>
          </Components.Socrata.Flannel.Footer>
        </Components.Socrata.Flannel.Wrapper>
      ) : null;
    }
  }

  render() {
    const { csvExport, translations, openBulkEditModal, selectedRowsCount, csvUrl } = this.props;

    const editTitle = Helpers.translator(translations, 'admin.bulk_edit.button_title');
    const csvExportTitle = Helpers.translator(translations, 'admin.export.Csv.button_label');

    return (
      <div className="bulk-actions">
        <div className="btn-group">
          <Button variant="simple" disabled={ selectedRowsCount < 2 } onClick={ openBulkEditModal }>
            { editTitle }
          </Button>

          <Components.Socrata.DownloadButton ref="csv"
                                             simple
                                             fileName={Constants.goalsCsvFilename}
                                             fileUrl={csvUrl}
                                             inProgress={csvExport.inProgress}
                                             onStartDownload={this.handleDownloadCsv}>
            { csvExportTitle }
          </Components.Socrata.DownloadButton>
        </div>
        { this.renderDownloadInfoBox() }
      </div>
    );
  }
}

const mapStateToProps = state => {
  // TODO: Remove the fallback to V1 when storyteller's V3 api is stable in production.
  const csvUrl = _.some(state.getIn(['goals', 'data']).toJS(), 'narrative') ?
    Constants.goalsCsvUrlV3 : Constants.goalsCsvUrlV1;

  return {
    csvUrl,
    translations: state.get('translations'),
    selectedRowsCount: State.getSelectedIds(state).count(),
    csvExport: Selectors.getCsvExport(state).toJS()
  };
};

const mapDispatchToProps = dispatch => ({
  openBulkEditModal: () => dispatch(Actions.BulkEdit.openModal()),
  downloadCsv: (csvUrl) => dispatch(Actions.DataExport.downloadCsv(csvUrl)),
  cancelDownloadCsv: () => dispatch(Actions.DataExport.cancelDownloadCsv())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(SocrataBulkActions);
