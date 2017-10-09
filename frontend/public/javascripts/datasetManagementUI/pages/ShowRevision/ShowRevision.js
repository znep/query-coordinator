import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import MetadataTable from 'containers/MetadataTableContainer';
import SchemaPreview from 'components/SchemaPreview/SchemaPreview';
import HomePaneSidebar from 'components/HomePaneSidebar/HomePaneSidebar';
import TablePreview from 'containers/TablePreviewContainer';
import RowDetails from 'components/RowDetails/RowDetails';
import styles from './ShowRevision.scss';

export function ShowRevision({ params, readFromCore, isPublishedDataset }) {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeContent}>
        <MetadataTable />
        <div className={styles.schemaPreviewContainer}>
          <SchemaPreview readFromCore={readFromCore} />
          <RowDetails
            fourfour={params.fourfour}
            revisionSeq={_.toNumber(params.revisionSeq)}
            isPublishedDataset={isPublishedDataset} />
        </div>
        {isPublishedDataset || (
          <section className={styles.tableContainer}>
            <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
            <TablePreview params={params} />
          </section>
        )}
      </div>
      <HomePaneSidebar defaultTab="recentActions" />
    </div>
  );
}

ShowRevision.propTypes = {
  params: PropTypes.object.isRequired,
  isPublishedDataset: PropTypes.bool.isRequired,
  readFromCore: PropTypes.bool.isRequired
};

const mapStateToProps = ({ entities }, { params }) => {
  const view = entities.views[params.fourfour];
  const revision = _.values(entities.revisions).find(
    rev => rev.revision_seq === _.toNumber(params.revisionSeq)
  );

  const isPublishedDataset = view.displayType !== 'draft';

  // use == in case osid is 0
  return {
    params,
    isPublishedDataset,
    readFromCore: isPublishedDataset && revision.output_schema_id == null
  };
};

export default connect(mapStateToProps)(ShowRevision);
