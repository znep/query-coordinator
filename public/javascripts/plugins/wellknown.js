/**
 * @module WKT
 * @description
 * Copied and pasted from: https://github.com/socrata-platform/wellknown.
 * Edits made:
 * - Support 2/3-tuple WKT conversions only. This makes GeoJSON conversions easier.
 * - Moved into WKT global module because we don't support module.exports here.
 */
var WKT = (function () {

  var numberRegexp = /[-+]?([0-9]*\.[0-9]+|[0-9]+)([eE][-+]?[0-9]+)?/;
  // Matches sequences like "100 100" or "100 100 100".
  var tuples = new RegExp('^' + numberRegexp.source + '\\s' + numberRegexp.source + '(\\s' + numberRegexp.source + ')?');

   /*
   * Parse WKT and return GeoJSON.
   *
   * @param {string} _ A WKT geometry
   * @return {?Object} A GeoJSON geometry object
   */
  function parse(_) {
      var parts = _.split(";"),
          _ = parts.pop(),
          srid = (parts.shift() || "").split("=").pop();

      var i = 0;

      function $(re) {
          var match = _.substring(i).match(re);
          if (!match) return null;
          else {
              i += match[0].length;
              return match[0];
          }
      }

      function crs(obj) {
          if (obj && srid.match(/\d+/)) {
              obj.crs = {
                  type: 'name',
                  properties: {
                      name: 'urn:ogc:def:crs:EPSG::' + srid
                  }
              };
          }

          return obj;
      }

      function white() { $(/^\s*/); }

      function multicoords() {
          white();
          var depth = 0, rings = [], stack = [rings],
              pointer = rings, elem;

          while (elem =
              $(/^(\()/) ||
              $(/^(\))/) ||
              $(/^(\,)/) ||
              $(tuples)) {
              if (elem == '(') {
                  stack.push(pointer);
                  pointer = [];
                  stack[stack.length - 1].push(pointer);
                  depth++;
              } else if (elem == ')') {
                  // For the case: Polygon(), ...
                  if (pointer.length === 0) return null;

                  pointer = stack.pop();
                  // the stack was empty, input was malformed
                  if (!pointer) return null;
                  depth--;
                  if (depth === 0) break;
              } else if (elem === ',') {
                  pointer = [];
                  stack[stack.length - 1].push(pointer);
              } else if (elem.split(/\s/g).every(parseFloat)) {
                  Array.prototype.push.apply(pointer, elem.split(/\s/g).map(parseFloat));
              } else {
                  return null;
              }
              white();
          }

          if (depth !== 0) return null;

          return rings;
      }

      function coords() {
          var list = [], item, pt;
          while (pt =
              $(tuples) ||
              $(/^(\,)/)) {
              if (pt == ',') {
                  list.push(item);
                  item = [];
              } else if (pt.split(/\s/g).every(parseFloat)) {
                  if (!item) item = [];
                  Array.prototype.push.apply(item, pt.split(/\s/g).map(parseFloat));
              }
              white();
          }

          if (item) list.push(item);
          else return null;

          return list.length ? list : null;
      }

      function point() {
          if (!$(/^(point)/i)) return null;
          white();
          if (!$(/^(\()/)) return null;
          var c = coords();
          if (!c) return null;
          white();
          if (!$(/^(\))/)) return null;
          return {
              type: 'Point',
              coordinates: c[0]
          };
      }

      function multipoint() {
          if (!$(/^(multipoint)/i)) return null;
          white();
          var c = multicoords();
          if (!c) return null;
          white();
          return {
              type: 'MultiPoint',
              coordinates: c
          };
      }

      function multilinestring() {
          if (!$(/^(multilinestring)/i)) return null;
          white();
          var c = multicoords();
          if (!c) return null;
          white();
          return {
              type: 'MultiLineString',
              coordinates: c
          };
      }

      function linestring() {
          if (!$(/^(linestring)/i)) return null;
          white();
          if (!$(/^(\()/)) return null;
          var c = coords();
          if (!c) return null;
          if (!$(/^(\))/)) return null;
          return {
              type: 'LineString',
              coordinates: c
          };
      }

      function polygon() {
          if (!$(/^(polygon)/i)) return null;
          white();
          var c = multicoords();
          if (!c) return null;
          return {
              type: 'Polygon',
              coordinates: c
          };
      }

      function multipolygon() {
          if (!$(/^(multipolygon)/i)) return null;
          white();
          var c = multicoords();
          if (!c) return null;
          return {
              type: 'MultiPolygon',
              coordinates: c
          };
      }

      function geometrycollection() {
          var geometries = [], geometry;

          if (!$(/^(geometrycollection)/i)) return null;
          white();

          if (!$(/^(\()/)) return null;
          while (geometry = root()) {
              geometries.push(geometry);
              white();
              $(/^(\,)/);
              white();
          }
          if (!$(/^(\))/)) return null;

          return {
              type: 'GeometryCollection',
              geometries: geometries
          };
      }

      function root() {
          return point() ||
              linestring() ||
              polygon() ||
              multipoint() ||
              multilinestring() ||
              multipolygon() ||
              geometrycollection();
      }

      return crs(root());
  }

  /**
   * Stringifies a GeoJSON object into WKT
   */
  function stringify(gj) {
      if (gj.type === 'Feature') {
          gj = gj.geometry;
      }

      function pairWKT(c) {
          if (c.length === 2) {
              return c[0] + ' ' + c[1];
          } else if (c.length === 3) {
              return c[0] + ' ' + c[1] + ' ' + c[2];
          }
      }

      function ringWKT(r) {
          return r.map(pairWKT).join(', ');
      }

      function ringsWKT(r) {
          return r.map(ringWKT).map(wrapParens).join(', ');
      }

      function multiRingsWKT(r) {
          return r.map(ringsWKT).map(wrapParens).join(', ');
      }

      function wrapParens(s) { return '(' + s + ')'; }

      switch (gj.type) {
          case 'Point':
              return 'POINT (' + pairWKT(gj.coordinates) + ')';
          case 'LineString':
              return 'LINESTRING (' + ringWKT(gj.coordinates) + ')';
          case 'Polygon':
              return 'POLYGON (' + ringsWKT(gj.coordinates) + ')';
          case 'MultiPoint':
              return 'MULTIPOINT (' + ringWKT(gj.coordinates) + ')';
          case 'MultiPolygon':
              return 'MULTIPOLYGON (' + multiRingsWKT(gj.coordinates) + ')';
          case 'MultiLineString':
              return 'MULTILINESTRING (' + ringsWKT(gj.coordinates) + ')';
          case 'GeometryCollection':
              return 'GEOMETRYCOLLECTION (' + gj.geometries.map(stringify).join(', ') + ')';
          default:
              throw new Error('stringify requires a valid GeoJSON Feature or geometry object as input');
      }
  }

  /**
   * @exports WKT/parse
   * @exports WKT/stringify
   */
  return {
    parse: parse,
    stringify: stringify
  };
})();