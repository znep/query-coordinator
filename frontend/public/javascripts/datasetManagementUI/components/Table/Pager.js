import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../../links';

export default function Pager({ path, currentPage, numPages }) {
  const prevPageUrl = Links.showOutputSchema(
    path.uploadId,
    path.inputSchemaId,
    path.outputSchemaId,
    currentPage - 1
  );
  const nextPageUrl = Links.showOutputSchema(
    path.uploadId,
    path.inputSchemaId,
    path.outputSchemaId,
    currentPage + 1
  );
  return (
    <div>
      <Link to={prevPageUrl}>&lt;</Link>
      {currentPage} of {numPages}
      <Link to={nextPageUrl}>&gt;</Link>
    </div>
  );
}

Pager.propTypes = {
  path: PropTypes.object.isRequired,
  currentPage: PropTypes.number.isRequired,
  numPages: PropTypes.number.isRequired
};
