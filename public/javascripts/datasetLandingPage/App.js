import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import Responsive from './lib/Responsive';
import PrivateNotice from './components/PrivateNotice';
import PublishNotice from './components/PublishNotice';
import InfoPane from './components/InfoPane';
import BlobPreview from './components/BlobPreview';
import BlobDownload from './components/BlobDownload';
import FeaturedContent from './components/FeaturedContent';
import MetadataTable from './components/MetadataTable';
import RowDetails from './components/RowDetails';
import SchemaPreview from './components/SchemaPreview';
import DatasetPreview from './components/DatasetPreview';
import RelatedViewList from './components/RelatedViewList';
import { VelocityComponent } from 'velocity-react';

export var App = React.createClass({
  propTypes: {
    view: PropTypes.object
  },

  renderDataset: function() {
    return (
      <div>
        <PublishNotice />
        <PrivateNotice />
        <InfoPane />

        <main className="container landing-page-container">
          <FeaturedContent />
          <MetadataTable />
          <RowDetails />
          <SchemaPreview />
          <DatasetPreview />

          <Responsive>
            <RelatedViewList />
          </Responsive>
        </main>
      </div>
    );
  },

  renderBlob: function() {
    return (
      <div>
        <PublishNotice />
        <PrivateNotice />
        <InfoPane />

        <main className="container landing-page-container">
          <BlobPreview />
          <FeaturedContent />
          <BlobDownload />
          <MetadataTable />
        </main>
      </div>
    );
  },

  render: function() {
    var { view } = this.props;
    var content;

    if (view.isBlobby) {
      content = this.renderBlob();
    } else {
      content = this.renderDataset();
    }

    return (
      <VelocityComponent animation={{ opacity: 1 }} runOnMount duration={275}>
        <div style={{ opacity: 0 }}>
          {content}
        </div>
      </VelocityComponent>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(App);
