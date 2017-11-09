import React from 'react';
import AddColForm from 'containers/AddColFormContainer';
import SchemaPreivewTable from 'containers/SchemaPreviewTableContainer';
import styles from './ShowOutputSchema.scss';

const AddColPane = () => (
  <div className={styles.addColPane}>
    <AddColForm />
    <SchemaPreivewTable />
  </div>
);

export default AddColPane;
