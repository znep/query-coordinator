import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './OutputSchemaSidebar.scss';
import sidebarStyles from '../MetadataContent/MetadataContent.scss';
import SchemaActions from 'components/SchemaActions/SchemaActions';
import { IndexLink, Link } from 'react-router';
import * as Links from 'links/links';

const SubI18n = I18n.show_output_schema;

class OutputSchemaSidebar extends Component {
  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps.params, this.props.params);
  }

  render() {
    const { params, showShortcut } = this.props;
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
        <Link
          to={Links.showParseOptions(params)}
          className={sidebarStyles.tab}
          activeClassName={sidebarStyles.selected}>
          <SocrataIcon name="question" />
          {SubI18n.specify_headers}
        </Link>
        <Link
          onClick={() => showShortcut('geocode')}
          className={sidebarStyles.tab}
          activeClassName={sidebarStyles.selected}>
          <SocrataIcon name="geo" />
          {SubI18n.geocode}
        </Link>
        <Link
          to={Links.showAddCol(params)}
          className={sidebarStyles.tab}
          activeClassName={sidebarStyles.selected}>
          {SubI18n.add_col}
        </Link>
        <SchemaActions />
      </div>
    );
  }
}

OutputSchemaSidebar.propTypes = {
  params: PropTypes.object.isRequired,
  showShortcut: PropTypes.func.isRequired
};

export default OutputSchemaSidebar;
