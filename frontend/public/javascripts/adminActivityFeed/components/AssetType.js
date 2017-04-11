import React from 'react';

export default class AssetType extends React.Component {
  render() {
    const { type } = this.props;

    // TODO: Render asset type with icon on left, use type to decide which icon to use
    return <strong>{ type }</strong>;
  }
}

AssetType.propTypes = {
  type: React.PropTypes.string.isRequired
};
