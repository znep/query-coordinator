import PropTypes from 'prop-types';
import React from 'react';
import RevisionRowDetails from 'datasetManagementUI/containers/RevisionRowDetailsContainer';
import ViewRowDetails from 'datasetManagementUI/containers/ViewRowDetailsContainer';

// This component acts as a switch, showing one of two containers depending on
// if we are editing a published dataset or not. If editing a published dataset,
// the switch returns the ViewRowDetails container, which looks to the view for
// its data and then uses that data to create te props for Common/RowDetails. If
// not, it renders RevisionRowDetails, which uses the revision form Common/RowDetails'
// props.

// This switch is necessary because if we are editing a published dataset,
// we might not have an output schema in DSMAPI (e.g. if it is a metadata only edit).
const RowDetails = ({ isPublishedDataset, ...props }) => {
  return isPublishedDataset ? <ViewRowDetails {...props} /> : <RevisionRowDetails {...props} />;
};

RowDetails.propTypes = {
  isPublishedDataset: PropTypes.bool.isRequired,
  revisionSeq: PropTypes.number.isRequired,
  fourfour: PropTypes.string.isRequired
};

export default RowDetails;
