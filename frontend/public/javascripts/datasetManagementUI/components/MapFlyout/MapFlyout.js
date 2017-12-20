/* eslint prefer-const: 0 */
import PropTypes from 'prop-types';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as styles from './MapFlyout.scss';
import PagerBar from 'containers/PagerBarContainer';
import _ from 'lodash';
import L from 'leaflet';
import './leaflet.css';

class Bbox {
  minx = Infinity;
  maxx = -Infinity;
  miny = Infinity;
  maxy = -Infinity;

  isValid() {
    return _.isFinite(this.minx) &&
      _.isFinite(this.maxx) &&
      _.isFinite(this.miny) &&
      _.isFinite(this.maxy);
  }

  expandCoordinate([x, y]) {
    this.minx = Math.min(this.minx, x);
    this.maxx = Math.max(this.maxx, x);

    this.miny = Math.min(this.miny, y);
    this.maxy = Math.max(this.maxy, y);
  }

  expandPoint(p) {
    this.expandCoordinate(p.coordinates);
  }

  expandLineIsh(l) {
    for (let c of l.coordinates) {
      this.expandCoordinate(c);
    }
  }

  expandPolygonIsh(p) {
    for (let coords of p.coordinates) {
      for (let c of coords) {
        this.expandCoordinate(c);
      }
    }
  }

  expandMultiPolygon(mp) {
    for (let poly of mp.coordinates) {
      for (let line of poly) {
        for (let c of line) {
          this.expandCoordinate(c);
        }
      }
    }
  }

  expand(geom) {
    switch (geom.type) {
      case 'Point':
        return this.expandPoint(geom);
      case 'LineString':
        return this.expandLineIsh(geom);
      case 'Polygon':
        return this.expandPolygonIsh(geom);
      case 'MultiPoint':
        return this.expandLineIsh(geom);
      case 'MultiLineString':
        return this.expandPolygonIsh(geom);
      case 'MultiPolygon':
        return this.expandMultiPolygon(geom);
      default:
        console.error(`Invalid geom type ${geom.type}`);
    }
  }

  toLeaflet() {
    const southWest = L.latLng(this.miny, this.maxx);
    const northEast = L.latLng(this.maxy, this.minx);
    return L.latLngBounds(southWest, northEast);
  }
}

function renderAttr(column, outputColumn) {
  if (column.cell && !_.isUndefined(column.cell.ok)) {
    return (<tr key={outputColumn.id}>
      <td className={styles.attributeName}>{outputColumn.display_name}</td>
      <td className={styles.attributeValue}>{column.cell.ok}</td>
    </tr>);
  } else if (column.cell && !_.isUndefined(column.cell.error)) {
    return (<tr key={outputColumn.id}>
      <td className={styles.attributeName}>{outputColumn.display_name}</td>
      <td className={styles.attributeValue}>{column.cell.error.message.english}</td>
    </tr>);
  }
  return null;
}

function renderPopupHtml(outputColumns, attributes) {
  return ReactDOM.render(
    <div className="socrata-flyout">
      <table className={styles.flyoutContent}>
        <tbody>
          {attributes.map(column => renderAttr(column, _.find(outputColumns, { id: column.id })))}
        </tbody>
      </table>
      <div className={styles.arrowDown}></div>
    </div>,
    document.createElement('div')
  );
}

function bindPopup(marker, outputColumns, attributes) {
  return marker.bindPopup(renderPopupHtml(outputColumns, attributes))
    .on('mouseover', () => marker.openPopup());
}

const pointToLatLng = ([lng, lat]) => L.latLng(lat, lng);

const lineToLatLng = (coords) => coords.map(pointToLatLng);

const polygonToLatLng = (poly) => poly.map(lineToLatLng);

const pointMarker = (pointCoords) => L.marker(
  pointToLatLng(pointCoords),
  { icon: L.divIcon({ className: 'feature-map-user-current-position-icon' }) }
);

const lineMarker = (lineCoords) => L.polyline(
  lineToLatLng(lineCoords),
  { color: '#00a1af' }
);

const polygonMarker = (polygonCoords) => L.multiPolygon(
  polygonToLatLng(polygonCoords),
  { color: '#00a1af' }
);


class MapFlyout extends React.Component {

  constructor(props) {
    super(props);

    this.map = null;
    this.featureLayer = null;

    this.genFeatureLayer = this.genFeatureLayer.bind(this);
  }

  componentDidMount() {
    this.map = L.map(ReactDOM.findDOMNode(this).querySelector('.map'), {
      minZoom: 2,
      maxZoom: 20,
      layers: [
        L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>' // eslint-disable-line
          }
        )
      ],
      attributionControl: false
    });

    this.addFeatureLayer();
  }

  componentWillReceiveProps() {
    this.addFeatureLayer();
  }

  componentWillUnmount() {
    this.map = null;
  }


  getGeoms() {
    return _.flatMap(this.props.rows, (row) => {
      return row.columns.filter(column => column.tid === this.props.transform.id);
    }).filter((column) => column.cell && column.cell.ok).map(column => column.cell.ok);
  }

  genBbox(geoms) {
    let bbox = new Bbox();
    for (let geom of geoms) {
      bbox.expand(geom);
    }
    if (bbox.isValid()) {
      return { bbox: bbox.toLeaflet(), valid: true };
    }
    return { valid: false };
  }


  flatMapGeoms(fun) {
    return _.flatMap(this.props.rows, (row) => {
      const geoms = row.columns.filter(column => column.tid === this.props.transform.id);
      if (geoms.length > 0) {
        const theGeom = geoms[0];

        if (theGeom.cell && theGeom.cell.ok) {
          const attributes = row.columns.filter(column => column.tid !== this.props.transform.id);
          return fun(theGeom.cell.ok, attributes);
        }
      }

      return [];
    });
  }

  _singleGroup(genMarker) {
    const markers = this.flatMapGeoms((geom, attributes) => {
      return [bindPopup(
        genMarker(geom.coordinates),
        this.props.outputColumns,
        attributes
      )];
    });

    return L.layerGroup(markers);
  }

  _multiGroup(genMarker) {
    const multiMarkers = this.flatMapGeoms((geom, attributes) => {
      return geom.coordinates.map((subGeom) => {
        return bindPopup(
          genMarker(subGeom),
          this.props.outputColumns,
          attributes
        );
      });
    });

    return L.layerGroup(multiMarkers);
  }

  genFeatureLayer() {
    switch (this.props.transform.output_soql_type) {
      case 'point':
        return this._singleGroup(pointMarker);
      case 'line':
        return this._singleGroup(lineMarker);
      case 'polygon':
        return this._singleGroup(polygonMarker);
      case 'multipoint':
        return this._multiGroup(pointMarker);
      case 'multiline':
        return this._multiGroup(lineMarker);
      case 'multipolygon':
        return this._multiGroup(polygonMarker);
      default:
        console.error('Unsupported shape type', this.props.transform.output_soql_type);
        return;
    }
  }


  addFeatureLayer() {
    if (!this.map) return;

    if (this.featureLayer) {
      this.map.removeLayer(this.featureLayer);
    }

    this.featureLayer = this.genFeatureLayer();

    this.map.addLayer(this.featureLayer);

    // bbox will be invalid when there are 0 geoms, so we won't fit
    // bounds in that case
    const { valid, bbox } = this.genBbox(this.getGeoms());
    if (valid) {
      this.map.fitBounds(bbox);
    }
  }


  render() {
    const { displayState, params, left } = this.props;

    return (
      <div className={styles.mapFlyout} style={{ left }}>
        <div className={styles.mapContainer}>
          <div className="map"></div>
        </div>
        <div className={styles.pagerWrapperStyleReset}>
          <PagerBar
            displayState={displayState}
            params={params} />
        </div>
      </div>
    );
  }
}

MapFlyout.propTypes = {
  rows: PropTypes.array.isRequired,
  outputColumns: PropTypes.array.isRequired,
  transform: PropTypes.object.isRequired,
  left: PropTypes.number.isRequired,
  params: PropTypes.object.isRequired,
  displayState: PropTypes.object.isRequired
};

export default MapFlyout;