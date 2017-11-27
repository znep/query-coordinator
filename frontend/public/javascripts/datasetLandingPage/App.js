import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
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
import SchemaDotOrgMarkup, { Taxonomy } from './components/SchemaDotOrgMarkup';

export class App extends Component {
  renderDatasetContainer() {
    return (
      <div itemScope itemType={Taxonomy.DATASET}>
        <PublishNotice />
        <PrivateNotice />
        <SchemaDotOrgMarkup />

        <Responsive>
          <InfoPane />
        </Responsive>

        <div className="container landing-page-container">
          <FeaturedContent />
          <HrefDownload />
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
      <div itemScope itemType={Taxonomy.DATASET}>
        <PublishNotice />
        <PrivateNotice />
        <SchemaDotOrgMarkup />
        <InfoPane />

        <div className="container landing-page-container">
          <BlobPreview />
          <FeaturedContent />
          <HrefDownload />
          <BlobDownload />
          <MetadataTable />
        </div>
      </div>
    );
  }

  renderHrefContainer() {
    return (
      <div itemScope itemType={Taxonomy.DATASET}>
        <PublishNotice />
        <PrivateNotice />
        <SchemaDotOrgMarkup />
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
    const { view } = this.props;

    if (view.isBlobby) {
      return this.renderBlobContainer();
    } else if (view.isHref) {
      return this.renderHrefContainer();
    } else {
      return this.renderDatasetContainer();
    }
  }
}

App.propTypes = {
  view: PropTypes.object
};

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(App);
