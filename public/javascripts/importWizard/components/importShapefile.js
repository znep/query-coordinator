import React, { PropTypes } from 'react';
import NavigationControl from './navigationControl';

import { FILE_UPLOAD_COMPLETE } from './uploadFile';
import * as Utils from '../utils';

export function view({ layers, fileName, dispatch, goToPage, goToPrevious }) {

  const I18nPrefixed = I18n.screens.dataset_new.import_shapefile;

  function layerView(layer, index) {
    const I18nImportCommon = I18n.screens.import_common;
    return (
      <li
        className="importLayer ui-draggable"
        key={`layer_${index}`}>
        <div className="mainLine line">
          <div className="layerHandleCell importHandleCell"></div>
          <div className="layerNameCell">
            <input
              type="text"
              className="layerName textPrompt required valid"
              title="Name this column"
              value={layer.name}
              onChange={(event) => dispatch(updateLayerAction(index, event.target.value))} />
          </div>
          <div className="layerReferenceSystemCell">{layer.referenceSystem}</div>
          <div className="layerReplacingCell">
            <div className="selector uniform" id="uniform-undefined">
              <div className="container">
                <div><span>{I18nImportCommon.new_layer}</span></div>
              </div>
              <select className="layerReplaceDropdown" style={{opacity: 0}}>
                <option className="special" value="">{I18nImportCommon.new_layer}</option>
              </select>
            </div>
          </div>
        </div>
      </li>
    );
  }

  function shapefilePane() {
    if (layers.length === 0) {
      return (
        <div className="abbreviatedShapeSummary" style={{display: 'none'}}>
          <p className="headline">Map layers in “<span className="fileName">School_Districts.zip</span>” will be created upon import.</p>
          <p className="subheadline">Summarizing this dataset may take a long time. Click next to import it.</p>
        </div>
      );
    } else {
      return (
        <div className="shapeSummary">
          <p className="headline">{I18nPrefixed.headline_interpolate.format(fileName)}</p>
          <p className="subheadline">{I18nPrefixed.subheadline_interpolate.format(layers.length)}</p>

          <h2>{I18nPrefixed.layers_list}</h2>
          <div className="layersListHeader importListHeader clearfix">
            <div className="layerHandleCell importHandleCell"></div>
            <div className="layerNameCell">{I18nPrefixed.name}</div>
            <div className="layerReferenceSystemCell">{I18nPrefixed.crs}</div>
          </div>
          <p className="subheadline pendingLayersMessage" style={{display: 'none'}}>{I18nPrefixed.pending}</p>
          <ul className="layersList importList" style={{display: 'block'}}>
            {_.map(layers, layerView)}
          </ul>
        </div>
      );
    }
  }

  return (
    <div>
      <div className="importShapefilePane" style={{width: '1000px', display: 'list-item'}}>
        <div className="flash"></div>
        {shapefilePane()}
      </div>
      <NavigationControl
        onNext={() => goToPage('Metadata')}
        onPrev={goToPrevious} />
    </div>
  );
}

view.propTypes = {
  layers: PropTypes.array.isRequired,
  fileName: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
  goToPage: PropTypes.func.isRequired,
  goToPrevious: PropTypes.func.isRequired
};

// actions
export const SHAPEFILE_UPDATE_LAYER = 'SHAPEFILE_UPDATE_LAYER';
export function updateLayerAction(layerIndex, layerName) {
  return {
    type: SHAPEFILE_UPDATE_LAYER,
    layerIndex,
    layerName
  };
}

// reducer
export function update(layers = null, action) {
  switch (action.type) {
    case FILE_UPLOAD_COMPLETE:
      if (!_.isUndefined(action.summary.layers)) {
        return action.summary.layers;
      } else {
        return layers;
      }
    case SHAPEFILE_UPDATE_LAYER:
      return Utils.updateAt(layers, action.layerIndex, (layer) => {
        return {
          ...layer,
          name: action.layerName
        };
      });
    default:
      return layers;
  }
}
