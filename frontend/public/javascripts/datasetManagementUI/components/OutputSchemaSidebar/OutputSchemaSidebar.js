import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './OutputSchemaSidebar.scss';
import sidebarStyles from '../MetadataContent/MetadataContent.scss';
import classNames from 'classnames';
import { Link } from 'react-router';
import * as Links from 'links/links';

const SubI18n = I18n.show_output_schema;

const OutputSchemaSidebar = props => {
  const { params, page } = props;

  const outputSchemaClass = classNames(
    sidebarStyles.tab,
    { [sidebarStyles.selected]: page === 'output_schema' }
  );

  const parseOptionsClass = classNames(
    sidebarStyles.tab,
    { [sidebarStyles.selected]: page === 'parse_options' }
  );

  return (
    <div className={classNames(sidebarStyles.sidebar, styles.outputSchemaSidebar)}>
      <Link
        to={Links.showOutputSchema(
          params,
          params.sourceId,
          params.inputSchemaId,
          params.outputSchemaId
        )}
        className={outputSchemaClass}>
        <SocrataIcon name="table" />
        {SubI18n.preview_table}
      </Link>
      <Link
        to={Links.showParseOptions(params)}
        className={parseOptionsClass}>
        <SocrataIcon name="question" />
        {SubI18n.specify_headers}
      </Link>
    </div>
  );
};

OutputSchemaSidebar.propTypes = {
  params: PropTypes.object.isRequired,
  page: PropTypes.string.isRequired
};

export default OutputSchemaSidebar;
