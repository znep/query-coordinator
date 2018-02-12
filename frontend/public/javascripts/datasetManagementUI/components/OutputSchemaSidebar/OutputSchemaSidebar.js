import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './OutputSchemaSidebar.module.scss';
import sidebarStyles from './Sidebar.module.scss';
import SchemaActions from 'datasetManagementUI/containers/SchemaActionsContainer';
import { IndexLink, Link } from 'react-router';
import * as Links from 'datasetManagementUI/links/links';

const SubI18n = I18n.show_output_schema;
// TODO: unbork geocoding and parse options in edit mode then re-enable this stuff

class OutputSchemaSidebar extends Component {
  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps.params, this.props.params);
  }

  render() {
    const { params, isPublished } = this.props;
    // TODO: switch the geo modal thing into a page
    return (
      <div className={[sidebarStyles.sidebar, styles.outputSchemaSidebar].join(' ')}>
        <IndexLink
          to={Links.showOutputSchema(params, params.sourceId, params.inputSchemaId, params.outputSchemaId)}
          className={sidebarStyles.tab}
          activeClassName={sidebarStyles.selected}>
          <SocrataIcon name="table" />
          {SubI18n.preview_table}
        </IndexLink>
        {isPublished ? (
          <span className={sidebarStyles.disabled}>{SubI18n.specify_headers}</span>
        ) : (
          <Link
            to={Links.showParseOptions(params)}
            className={sidebarStyles.tab}
            activeClassName={sidebarStyles.selected}>
            <SocrataIcon name="settings" />
            {SubI18n.specify_headers}
          </Link>
        )}
        {isPublished ? (
          <span className={sidebarStyles.disabled}>{SubI18n.geocode}</span>
        ) : (
          <Link
            to={Links.geocodeShortcut(params)}
            className={sidebarStyles.tab}
            activeClassName={sidebarStyles.selected}>
            <SocrataIcon name="geo" />
            {SubI18n.geocode}
          </Link>
        )}
        <Link
          to={Links.showAddCol(params)}
          className={sidebarStyles.tab}
          activeClassName={sidebarStyles.selected}>
          <SocrataIcon name="add" />
          {SubI18n.add_col}
        </Link>
        <SchemaActions />
      </div>
    );
  }
}

OutputSchemaSidebar.propTypes = {
  params: PropTypes.object.isRequired,
  isPublished: PropTypes.bool.isRequired
};

export default OutputSchemaSidebar;
