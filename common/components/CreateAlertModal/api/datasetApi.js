import 'whatwg-fetch';
import _ from 'lodash';
import airbrake from 'common/airbrake';
import { defaultHeaders, fetchJson } from 'common/http';

// Extracts column info from /api/views/four-four response and converts it into
// picklist options format.
const formatColumnData = (response) => {
  const columns = _.get(response, 'columns', []);

  return columns.map((column) => {
    return {
      title: _.get(column, 'name'),
      value: _.get(column, 'fieldName'),
      column_type: _.get(column, 'dataTypeName')
    };
  });
};



// Converts mapbox geocode response to picklist options format.
// Mapbox Geocode Sample Response:
// {
//   "type":"FeatureCollection",
//   "query":["coi"],
//   "features":[
//     {
//       "id": "place.10456850936703450",
//       "type":"Feature",
//       "place_type": ["place"],
//       "relevance": 1,
//       "properties": {"wikidata":"Q3348861"},
//       "text":"Coimbra",
//       "place_name":"Coimbra, Coimbra, Portugal",
//       "bbox":[-8.591664,40.098923,-8.312903,40.352013],
//       "center":[-8.45229,40.2255],
//       "geometry":{  "type": "Point", "coordinates": [-8.45229,40.2255] },
//       "context":[...]},
//     }
//   ],
//   ...
// }
const formatMapboxGeocodeResponse = (response) => {
  const features = _.get(response, 'features', []);

  return features.map((feature) => {
    return {
      title: _.get(feature, 'place_name'),
      value: _.get(feature, 'place_name'),
      geometry: _.get(feature, 'geometry')
    };
  });
};

export const datasetApi = (() => {
  return {
    // Get columns in the given view along with the column's type(datatype).
    getColumns: (params) => {
      return fetchJson(`/api/views/${params.viewId}.json`, {
        method: 'GET',
        headers: defaultHeaders,
        credentials: 'same-origin'
      }).
      then((response) => formatColumnData(response));
    },

    // Get migration information for a given view.
    getMigration: (params) => {
      return fetchJson(`/api/migrations/${params.viewId}.json`, {
        method: 'GET',
        headers: defaultHeaders,
        credentials: 'same-origin'
      }).
      catch((e) => {
        // some OBE dataset doesn't have migration, so query fails
        return {}; // returns empty hash if migration fails
      });
    },

  };
})();

export default datasetApi;
