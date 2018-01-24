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

// Converts soql response fetching top x columns into picklist options format.
const formatColumnValues = (data, column) => {
  return data.map((datum) => {
    return { title: datum[column], value: datum[column] };
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
    // Get top x values in a column. Used against obe datasets, which do not
    // support 'like' operator, so can not do a complete typeahead option.
    getTopValuesByColumn: (params) => {
      const column = params.column;
      const limit = (_.get(params, 'limit', 20));
      const conditionText = `$select=${column}&$group=${column}&$limit=${limit}`;

      return fetchJson(`/resource/${params.viewId}.json?${conditionText}`, {
        method: 'GET',
        headers: defaultHeaders,
        credentials: 'same-origin'
      }).
        then((response) => formatColumnValues(response, column));
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
    // Get top x values in the params.column in params.viewId matching
    // the given params.search using like operator.
    // Will work only against NBE datasets.
    // Params:
    //    column      : column in the dataset to search for matching values
    //    searchText  : search term
    //    viewId      : view id to search for matching values.
    getMatchingColumnValues: (params) => {
      const column = params.column;
      const searchText = encodeURIComponent((params.searchText || '').toUpperCase());
      const conditionText = `$select=${column}&$group=${column}&$$read_from_nbe=true` +
        `&$where=UPPER(${column}) like '%25${searchText}%25'`;

      return fetchJson(`/resource/${params.viewId}.json?${conditionText}`, {
        method: 'GET',
        headers: defaultHeaders,
        credentials: 'same-origin'
      }).
        then((response) => formatColumnValues(response, column));
    },
    // Given a search string, it geocodes using mapbox API and returns back matching
    // results in pick list options format.
    geoSearch : (searchString, accessToken) => {
      const geoQueryUrl = 'https://a.tiles.mapbox.com/geocoding/v5/mapbox.places/';
      const queryEndpoint = geoQueryUrl + encodeURIComponent(searchString) + '.json' +
        `?access_token=${accessToken}`;

      return fetchJson(queryEndpoint, { method: 'GET' }).
        then((response) => formatMapboxGeocodeResponse(response));
    }
  };
})();

export default datasetApi;
