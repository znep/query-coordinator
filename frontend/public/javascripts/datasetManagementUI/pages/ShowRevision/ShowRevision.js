import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import MetadataTable from 'containers/MetadataTableContainer';
import SchemaPreview from 'components/SchemaPreview/SchemaPreview';
import HomePaneSidebar from 'components/HomePaneSidebar/HomePaneSidebar';
import TablePreview from 'containers/TablePreviewContainer';
import RowDetails from 'components/RowDetails/RowDetails';
import styles from './ShowRevision.module.scss';

export class ShowRevision extends Component {
  constructor() {
    super();
    this.state = { recentActionsOpened: false };
    this.toggleRecentActions = this.toggleRecentActions.bind(this);
  }
  toggleRecentActions() {
    this.setState({ recentActionsOpened: !this.state.recentActionsOpened });
  }
  render() {
    const { params, readFromCore, isPublishedDataset, isParentRevision, hasOutputSchema } = this.props;
    return (
      <div className={`${styles.homeContainer} show-revision-container`}>
        <div className={`${styles.homeContent} show-revision-content`}>
          {this.state.recentActionsOpened ?
            <HomePaneSidebar toggleRecentActions={this.toggleRecentActions} /> :
          (
            <button
              className="recent-actions-btn btn btn-alternate-1"
              onClick={this.toggleRecentActions}>
              {I18n.home_pane.home_pane_sidebar.recent_actions}
            </button>
          )}
          <MetadataTable />
          {hasOutputSchema && (<div className={styles.schemaPreviewContainer}>
            <SchemaPreview readFromCore={readFromCore} />
            {isParentRevision || <RowDetails
              fourfour={params.fourfour}
              revisionSeq={_.toNumber(params.revisionSeq)}
              isPublishedDataset={isPublishedDataset} />}
          </div>)}
          {isPublishedDataset || isParentRevision || (
            <TablePreview params={params} />
          )}
        </div>
      </div>
    );
  }
}

ShowRevision.propTypes = {
  params: PropTypes.object.isRequired,
  isPublishedDataset: PropTypes.bool.isRequired,
  readFromCore: PropTypes.bool.isRequired,
  isParentRevision: PropTypes.bool,
  hasOutputSchema: PropTypes.bool
};

const mapStateToProps = ({ entities }, { params }) => {
  const view = entities.views[params.fourfour];
  const revision = _.values(entities.revisions).find(
    rev => rev.revision_seq === _.toNumber(params.revisionSeq)
  );

  const isPublishedDataset = view.displayType !== 'draft';
  const isParentRevision = revision.is_parent;

  // use == in case osid is 0
  return {
    params,
    isPublishedDataset,
    readFromCore: isPublishedDataset && revision.output_schema_id == null,
    isParentRevision,
    hasOutputSchema: !_.isNil(revision.output_schema_id)
  };
};

export default connect(mapStateToProps)(ShowRevision);
