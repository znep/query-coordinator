import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import MetadataTable from 'containers/MetadataTableContainer';
import SchemaPreview from 'components/SchemaPreview/SchemaPreview';
import HomePaneSidebar from 'components/HomePaneSidebar/HomePaneSidebar';
import TablePreview from 'containers/TablePreviewContainer';
import RowDetails from 'components/RowDetails/RowDetails';
import styles from './ShowRevision.module.scss';

export function ShowRevision({ params, readFromCore, isPublishedDataset, isParentRevision }) {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeContent}>
        <MetadataTable />
        <div className={styles.schemaPreviewContainer}>
          <SchemaPreview readFromCore={readFromCore} />
          {isParentRevision || <RowDetails
            fourfour={params.fourfour}
            revisionSeq={_.toNumber(params.revisionSeq)}
            isPublishedDataset={isPublishedDataset} />}
        </div>
        {isPublishedDataset || isParentRevision || (
          <TablePreview params={params} />
        )}
      </div>
      <HomePaneSidebar />
    </div>
  );
}

ShowRevision.propTypes = {
  params: PropTypes.object.isRequired,
  isPublishedDataset: PropTypes.bool.isRequired,
  readFromCore: PropTypes.bool.isRequired,
  isParentRevision: PropTypes.bool
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
    isParentRevision
  };
};

export default connect(mapStateToProps)(ShowRevision);
