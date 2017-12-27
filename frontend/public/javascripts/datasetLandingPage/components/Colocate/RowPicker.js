import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { MetadataProvider } from 'common/visualizations/dataProviders';

import { getIconForDataType } from 'common/icons';
import { Picklist, SocrataIcon } from 'common/components';
import classNames from 'classnames';

export default class RowPicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      title: null,
      pickOptions: []
    };
  }

  componentDidMount() {
    getPickColumns(this.props.targetData).then(
      ({ title, columns }) => {
        this.setState({
          loading: false,
          title,
          pickOptions: columns
        });
      }
    );
  }

  render() {
    const props = this.props;
    const state = this.state;

    const body = state.loading ?
    (<span className="spinner-default" />) :
    (<div className={classNames('row-select', { 'target': props.onTitleClick != null })}>
      <span onClick={props.onTitleClick}><h3>{state.title}</h3></span>
      <Picklist
        onSelection={props.onSelect}
        options={state.pickOptions} />
    </div>);

    return body;
  }
}

RowPicker.propTypes = {
  // Just a DOM ID.
  id: PropTypes.string,

  // The 4x4 to get columns for
  targetData: PropTypes.string,

  // Column selected
  onSelect: PropTypes.func,

  // Title click handler
  onTitleClick: PropTypes.func
};

async function getPickColumns(uid) {
  var metadataProvider = new MetadataProvider({
    domain: window.location.hostname,
    datasetUid: uid
  });

  const metadataPromise = metadataProvider.getDatasetMetadata();
  const columns = await metadataProvider.getDisplayableFilterableColumns(await metadataPromise);

  const title = (await metadataPromise).name;

  return {
    title: title,
    columns: columns.map((c) => ({
      title: c.name,
      value: c.name,
      icon: <SocrataIcon name={getIconForDataType(c.dataTypeName)} />
    }))
  };
}
