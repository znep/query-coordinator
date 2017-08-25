import React, { PropTypes } from 'react';
import MetadataTable from 'containers/MetadataTableContainer';
import SchemaPreview from 'containers/SchemaPreviewContainer';
import HomePaneSidebar from 'containers/HomePaneSidebarContainer';
import TablePreview from 'containers/TablePreviewContainer';
import RowDetails from 'containers/RowDetailsContainer';
import styles from './ShowRevision.scss';

export function ShowRevision({ params }) {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeContent}>
        <MetadataTable />
        <div className={styles.schemaPreviewContainer}>
          <SchemaPreview />
          <RowDetails fourfour={params.fourfour} revisionSeq={params.revisionSeq} />
        </div>
        <section className={styles.tableContainer}>
          <h2 className={styles.header}>
            {I18n.home_pane.table_preview}
          </h2>
          <TablePreview params={params} />
        </section>
      </div>
      <HomePaneSidebar />
    </div>
  );
}

ShowRevision.propTypes = {
  params: PropTypes.object.isRequired
};

export default ShowRevision;
