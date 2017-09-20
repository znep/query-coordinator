import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect, Provider } from 'react-redux';
import Responsive from './lib/Responsive';
import PrivateNotice from './components/PrivateNotice';
import PublishNotice from './components/PublishNotice';
import InfoPane from './components/InfoPane';
import BlobPreview from './components/BlobPreview';
import BlobDownload from './components/BlobDownload';
import HrefDownload from './components/HrefDownload';
import FeaturedContent from './components/FeaturedContent';
import MetadataTable from './components/MetadataTable';
import RowDetails from './components/RowDetails';
import SchemaPreview from './components/SchemaPreview';
import DatasetPreview from './components/DatasetPreview';
import RelatedViewList from './components/RelatedViewList';

export class App extends Component {
  renderDatasetContainer() {
    return (
      <div>
        <PublishNotice />
        <PrivateNotice />

        <Responsive>
          <InfoPane />
        </Responsive>

        <div className="container landing-page-container">
          <FeaturedContent />
          <MetadataTable />
          <RowDetails />
          <SchemaPreview />
          <DatasetPreview />

          <Responsive>
            <RelatedViewList />
          </Responsive>
        </div>
      </div>
    );
  }

  renderBlobContainer() {
    return (
      <div>
        <PublishNotice />
        <PrivateNotice />
        <InfoPane />

        <div className="container landing-page-container">
          <BlobPreview />
          <FeaturedContent />
          <BlobDownload />
          <MetadataTable />
        </div>
      </div>
    );
  }

  renderHrefContainer() {
    return (
      <div>
        <PublishNotice />
        <PrivateNotice />
        <InfoPane />

        <div className="container landing-page-container">
          <FeaturedContent />
          <HrefDownload />
          <MetadataTable />
        </div>
      </div>
    );
  }

  render() {
    const { view, store } = this.props;
    let contents;

    if (view.isBlobby) {
      contents = this.renderBlobContainer();
    } else if (view.isHref) {
      contents = this.renderHrefContainer();
    } else {
      contents = this.renderDatasetContainer();
    }

    return (
      <Provider store={store}>
        {contents}
      </Provider>
    );
  }
}

App.propTypes = {
  view: PropTypes.object,
  store: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(App);
