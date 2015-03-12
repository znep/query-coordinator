/**
 * Service responsible for providing versioned JSON schemas.
 * Example usages:
 *
 * Adding a couple versions of the dataset_metadata schema:
 * Schemas.regarding('dataset_metadata').addSchemaWithVersion('0', {some JJV Schema});
 * Schemas.regarding('dataset_metadata').addSchemaWithVersion('0.1', {another JJV Schema});
 *
 * Validating against version 0.1 of the schema:
 * if (Schemas.regarding('dataset_metadata').isValidAgainstVersion('0.1', {some blob})) {
 *   alert('Blob validated!');
 * }
 */
(function() {
  'use strict';

  /**
   * A convenience function that takes an object of JJV validation errors that occurred, and an
   * object of strings for any error that could have occurred, and returns an object that maps the
   * errors that did occur to the strings for those errors.
   *
   * For example:
   * Input:
   *   JJVErrors: {
   *     page: {
   *       name: {
   *         minLength: true
   *       },
   *       description: {
   *         required: true
   *       }
   *     }
   *   }
   *
   *   errorStrings: {
   *     page: {
   *       name: {
   *         minLength: 'Please provide a name',
   *         maxLength: 'Your name is too long',
   *         required: 'Give us a name'
   *       },
   *       description: {
   *         minLength: 'Please provide a description',
   *         maxLength: 'Your description is too long',
   *         required: 'A description is required'
   *       }
   *     }
   *   }
   *
   * Output:
   *   {
   *     page: {
   *       name: [ 'Please provide a name' ],
   *       description: [ 'A description is required' ]
   *     }
   *   }
   *
   * @param {Object} JJVErrors - the validation object that JJV provides, on error.
   * @param {Object} errorStrings - an object with parallel structure to JJVErrors, where the leaf
   *   nodes are the text strings to be displayed when that error is encountered.
   * @return {Object} an object with a parallel structure to JJVErrors, except that the tree is
   *   one level shallower. The leaf nodes are arrays of strings representing all the error messages
   *   relevant to that node.
   */
  var getStringsForErrors = (function() {

    /**
     * A helper function that takes an object of existing errors and an object of strings for those
     * errors, and creates within the third object a map from existing errors to their strings.
     *
     * @private
     */
    function setErrorStrings(errors, stringSource, errorStrings) {
      // Recursively look for strings for each key in the error object
      _.each(errors, function(value, key) {
        if (stringSource[key]) {
          if (_.isString(stringSource[key])) {
            errorStrings[key] = stringSource[key];
          } else if (_.isObject(value)) {
            if (!errorStrings[key]) {
              errorStrings[key] = {};
            }
            setErrorStrings(value, stringSource[key], errorStrings[key]);
          }
        }
      });
    }

    /**
     * Given an object where the leaves are strings, and the leaves' parent has only string
     * children, returns a new object that collapses the leaves into an array of strings on its
     * parent.
     *
     * For example:
     * Input:
     *   { a: { b: { c: '1', d: '2', e: '3' }, f: { g: '4' } } }
     * Output:
     *   { a: { b: [ '1', '2', '3' ], f: [ '4' ] } }
     *
     * @private
     */
    function flattenLeaves(hash) {
      var keys = _.keys(hash);
      if (_.isString(hash[keys[0]])) {
        return _.map(hash, function(value, key) {
          return value;
        });
      } else {
        var result = {};
        _.each(hash, function(value, key) {
          result[key] = flattenLeaves(value);
        });
        return result;
      }
    }

    return function getStringsForErrors(JJVErrors, errorStrings) {
      var filteredErrorStrings = {};
      setErrorStrings(JJVErrors, errorStrings, filteredErrorStrings);
      return flattenLeaves(filteredErrorStrings);
    };
  })();

  angular.module('dataCards.services').factory('Schemas', function(JJV, SchemaDefinitions) {
    // Maps schema subject names ('dataset_metadata', 'page_metadata', etc) to a collection of
    // versioned schemas for that subject.  The collection of versioned schemas is stored as an
    // object whose keys are versions and whose values are the JSON schemas themselves.
    var versionedSchemaCollections = {};

    function fetchSchemaCollectionForSubject(schemaSubjectName) {
      var collection = versionedSchemaCollections[schemaSubjectName] || {};
      versionedSchemaCollections[schemaSubjectName] = collection;
      return collection;
    }

    function regarding(schemaSubjectName) {
      return {
        // Checks the given object for validity on a particular version of this schema.
        // Returns a validation object:
        // {
        //   valid: Boolean. True if the object matches this version schema, false otherwise.
        //   errors: Array of validation errors, or null if the object validated.
        // }
        validateAgainstVersion: function(schemaVersion, objectToValidate) {
          var schemaCollection = fetchSchemaCollectionForSubject(schemaSubjectName);
          var schemaWithDesiredVersion = schemaCollection[schemaVersion];

          var validationErrors = JJV.validate(schemaWithDesiredVersion, objectToValidate);
          return {
            valid: _.isEmpty(validationErrors),
            errors: validationErrors
          }
        },

        /**
        * Checks the given object for validity on a particular version of this schema.
        * Throws an error if the object is valid, else returns the object.
        * The error message contains the schema name, version, validation errors,
        * the object being validated, and an optional custom message.
        * @param {String} schemaVersion The schema version to validate against.
        * @param {Object} objectToValidate The object to validate against the schema.
        * @param {message} Custom message for error. Optional.
        */
        assertValidAgainstVersion: function(schemaVersion, objectToValidate, message) {
          var validation = this.validateAgainstVersion(schemaVersion, objectToValidate);
          if (_.isPresent(validation.errors)) {
            message = message || 'Data failed validation.';
            throw new Error(
              '{0}\nSchema: {1}\nVersion: {2}\n\nErrors:\n{3}\n\nData:\n{4}'.format(
                message,
                schemaSubjectName,
                schemaVersion,
                JSON.stringify(validation.errors),
                JSON.stringify(objectToValidate)
              )
            );
          }

          return objectToValidate;
        },

        // Checks the given object for validity on a particular version of this schema.
        // Returns true of the object matches this version schema, false otherwise.
        // If you want access to the validation errors, use validateAgainstVersion.
        isValidAgainstVersion: function(schemaVersion, objectToValidate) {
          return this.validateAgainstVersion(schemaVersion, objectToValidate).valid;
        },

        getSchemaDefinition: function(schemaVersion) {
          var schemaCollection = fetchSchemaCollectionForSubject(schemaSubjectName);
          return schemaCollection[schemaVersion];
        },

        addSchemaWithVersion: function(schemaVersion, schema) {
          fetchSchemaCollectionForSubject(schemaSubjectName)[schemaVersion] = schema;
        }
      };
    }

    var Schemas = {
      getStringsForErrors: getStringsForErrors,
      regarding: regarding
    };

    SchemaDefinitions.registerWith(Schemas);

    return Schemas;
  });
})();
