import React, { PropTypes } from 'react';
import _ from 'lodash';
import format from 'stringformat';

import * as ST from '../../sharedTypes';
import * as CD from './columnDetail';
import * as IC from '../importColumns';
import * as Utils from '../../utils';
import * as LC from './locationColumn';

// these type strings are lowercased because they're used as I18n keys
type ValidationProblem
  = { type: 'duplicate_names', name: string, instances: number }
  | { type: 'blank_names', instances: number }
  | { type: 'source_columns_dropped', sourceColumns: Array<string> }
  | { type: 'single_column_error', resultColumnName: string, error: SingleColumnError }

type SingleColumnError
  = { type: 'wrong_type', suggestedType: ST.TypeName, chosenType: ST.TypeName, invalidPercent: number }
  | { type: 'wrong_type_unknown_count', suggestedType: ST.TypeName, chosenType: ST.TypeName }
  | { type: 'type_too_generic', suggestedType: ST.TypeName, chosenType: ST.TypeName }
  | { type: 'empty_composite_col' }
  | { type: 'non_text_composite_col', chosenType: ST.TypeName }
  // plain col but should be location col
  | { type: 'wrong_type_location_plain_col', suggestedType: ST.TypeName, chosenType: ST.TypeName }
  // wrong type for location columns
  | {type: 'wrong_type_location', fieldName: string, chosenColumn: string, suggestedType: ST.TypeName, chosenType: ST.TypeName }
  // not lat & lon
  | {type: 'missing_lat_long', coordinateType: string, missingCoordinateType: string }


export function validate(translation: IC.Translation, sourceColumns: Array<ST.SourceColumn>): Array<ValidationProblem> {
  const singleColumnErrors = _.flatten(translation.map((column) => (
    validateResultColumn(column, sourceColumns).map(error => ({
      type: 'single_column_error',
      resultColumnName: column.name,
      error: error
    }))
  )));
  return _.compact([
    ...singleColumnErrors,
    ...checkColumnNames(translation),
    checkDroppedSourceColumns(translation, sourceColumns)
  ]);
}


function checkDroppedSourceColumns(translation: IC.Translation, sourceColumns: Array<ST.SourceColumn>): ?ValidationProblem {
  const allSourceCols = sourceColumns.map(column => column.name);
  const usedSourceCols =
    _.flatten(translation.map(resultCol => getUsedSourceCols(resultCol.columnSource))).
    map(sourceCol => sourceCol.name);
  const droppedCols = _.difference(allSourceCols, usedSourceCols);
  if (droppedCols.length === 0) {
    return null;
  } else {
    return {
      type: 'source_columns_dropped',
      sourceColumns: droppedCols
    };
  }
}


function getUsedSourceCols(source: IC.ColumnSource): Array<ST.SourceColumn> {
  switch (source.type) {
    case 'SingleColumn':
      return [source.sourceColumn];

    case 'CompositeColumn':
      return source.components.filter(component => _.isObject(component));

    case 'LocationColumn':
      return [];
    // TODO: actually get all used columns.
  }
}


function checkColumnNames(translation: IC.Translation): Array<ValidationProblem> {
  const groupedByName = _.groupBy(translation, column => column.name);

  const dupNamesErrors = _.toPairs(groupedByName).
    filter(([name, columns]) => (columns.length > 1 && name !== '')).
    map(([name, columns]) => ({ type: 'duplicate_names', name: name, instances: columns.length }));

  const numColsWithBlankName = _.get(groupedByName, '', []).length;
  const blankNamesError =
    numColsWithBlankName > 0
    ? { type: 'blank_names', instances: numColsWithBlankName }
    : null;

  return _.compact([...dupNamesErrors, blankNamesError]);
}


export function isError(problem: ValidationProblem): boolean {
  return _.includes(['duplicate_names', 'blank_names'], problem.type) ||
    (problem.type === 'single_column_error' && _.includes(['empty_composite_col', 'missing_lat_long'], problem.error.type));
}


export function emptyOrAllWarnings(problems: Array<ValidationProblem>): boolean {
  return problems.every(problem => !isError(problem));
}


function validateResultColumn(column: IC.ResultColumn, sourceColumns): Array<ValidationProblem> {
  switch (column.columnSource.type) {
    case 'SingleColumn':
      return validateSingleColumnSingleSource(column, column.columnSource.sourceColumn);

    case 'CompositeColumn':
      return validateSingleColumnCompositeSource(column, column.columnSource.components);

    case 'LocationColumn':
      return validateSingleColumnLocationColumn(column, sourceColumns);

    default:
      console.error(`unexpected column type: ${column.columnSource.type}`);
  }
}

function validateSingleColumnSingleSource(column: IC.ResultColumn, source: ST.SourceColumn): Array<ValidationProblem> {
  return _.compact([checkType(column.chosenType, source)]);
}

function validateSingleColumnCompositeSource(column: IC.ResultColumn, components: Array<CD.CompositeComponent>): Array<ValidationProblem> {
  const emptyError = components.length === 0
    ? { type: 'empty_composite_col' }
    : null;
  const notTextWarning = column.chosenType !== 'text'
    ? { type: 'non_text_composite_col', chosenType: column.chosenType }
    : null;
  return _.compact([emptyError, notTextWarning]);
}

const locationTypes = {
  street: ['text'],
  city: ['text'],
  state: ['text'],
  zip: ['number', 'text'],
  latitude: ['number'],
  longitude: ['number']
};

export function validateSingleColumnLocationColumn(column: LC.LocationSource, sourceColumns): Array<ValidationProblem> {
  const locationColumnComponents = column.columnSource.components;

  const latlon = coordinateError(locationColumnComponents);
  const street = fieldValidationWarning('street', locationColumnComponents.street, locationTypes.street, sourceColumns);
  const city = fieldOrTextValidationWarning('city', locationColumnComponents.city, locationTypes.city, sourceColumns);
  const state = fieldOrTextValidationWarning('state', locationColumnComponents.state, locationTypes.state, sourceColumns);
  const zip = fieldOrTextValidationWarning('zip', locationColumnComponents.zip, locationTypes.zip, sourceColumns);
  const lat = fieldValidationWarning('lat', locationColumnComponents.lat, locationTypes.latitude, sourceColumns);
  const lon = fieldValidationWarning('lon', locationColumnComponents.lon, locationTypes.longitude, sourceColumns);

  return _.compact([latlon, street, city, state, zip, lat, lon]);
}

export function coordinateError(locationColumnComponents) {
  const lat = locationColumnComponents.lat;
  const lon = locationColumnComponents.lon;

  if (_.has(lat, 'sourceColumn') && !_.has(lon, 'sourceColumn')) {
    return { type: 'missing_lat_long', coordinateType: 'latitude', missingCoordinateType: 'longitude' };
  } else if (!_.has(lat, 'sourceColumn') && _.has(lon, 'sourceColumn')) {
    return { type: 'missing_lat_long', coordinateType: 'longitude', missingCoordinateType: 'latitude' };
  } else {
    return null;
  }
}

export function fieldValidationWarning(fieldName, field, fieldType, sourceColumns) {
  if (_.has(field, 'sourceColumn')) {
    const index = field.sourceColumn.index;
    const sourceColumn = sourceColumns[index];
    const suggested = sourceColumn.suggestion;
    if (!(fieldType.indexOf(suggested) >= 0)) {
      return {type: 'wrong_type_location', fieldName: fieldName, chosenColumn: sourceColumn.name, suggestedType: _.join(fieldType, ' or '), chosenType: suggested};
    }
  }
  return null;
}

export function fieldOrTextValidationWarning(fieldName, field, fieldType, sourceColumns) {
  if (_.has(field.column, 'sourceColumn') && field.isColumn) {
    const index = field.column.sourceColumn.index;
    const sourceColumn = sourceColumns[index];
    const suggested = sourceColumn.suggestion;
    if (!(fieldType.indexOf(suggested) >= 0)) {
      return {type: 'wrong_type_location', fieldName: fieldName, chosenColumn: sourceColumn.name, suggestedType: _.join(fieldType, ' or '), chosenType: suggested};
    }
  }
  return null;
}


const commonErrorsSupportLink = 'http://support.socrata.com/entries/23786838-Import-Warning-and-Errors';

export function ViewProblems({ problems }) {
  if (problems.length === 0) {
    return null;
  } else {
    return (
      <div className="warningsSection">
        <h2>{I18n.screens.dataset_new.import_columns.errors_warnings}</h2>
        <p
          className="warningsHelpMessage"
          dangerouslySetInnerHTML={{__html:
            format(
              I18n.screens.dataset_new.import_columns.help_message_js,
              {common_errors: commonErrorsSupportLink}
            )}} />
        <ul className="columnWarningsList">
          {problems.map(problem => {
            const warningOrError = isError(problem) ? 'error' : 'warning';
            return (
              <li className={'validationError ' + warningOrError}>
                <span className="icon"></span>
                <span className="message" dangerouslySetInnerHTML={{__html: problemText(problem)}} />
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

ViewProblems.propTypes = {
  problems: PropTypes.arrayOf(PropTypes.object).isRequired
};


const I18nImportValidation = I18n.screens.dataset_new.import_columns.errors;

export function problemText(problem: ValidationProblem) {
  function oneOrMany(num: number, translations: string | {one_html: string, many_html: string}): string {
    if (translations.one_html && translations.many_html) {
      return num === 1 ? translations.one_html : translations.many_html;
    } else {
      return translations;
    }
  }

  switch (problem.type) {
    case 'duplicate_names': {
      const template = oneOrMany(problem.instances, I18nImportValidation.multiple_columns[problem.type]);
      return format(template, {
        ...problem,
        name: _.escape(problem.name)
      });
    }
    case 'blank_names': {
      const template = oneOrMany(problem.instances, I18nImportValidation.multiple_columns[problem.type]);
      return format(template, problem);
    }
    case 'source_columns_dropped': {
      const template = oneOrMany(
        problem.sourceColumns.length,
        I18nImportValidation.multiple_columns.source_columns_dropped
      );
      return format(
        template,
        { sourceColumns: Utils.wordifyList(problem.sourceColumns.map(col => (`<strong>“${_.escape(col)}”</strong>`))) }
      );
    }
    case 'single_column_error':
      switch (problem.error.type) {
        case 'wrong_type_location':
          return format(
            I18nImportValidation.single_column[problem.error.type],
            {
              resultColumnName: _.escape(problem.resultColumnName),
              field: _.escape(problem.error.fieldName),
              chosenColumn: _.escape(problem.error.chosenColumn),
              chosenType: _.escape(problem.error.chosenType),
              suggestedType: _.escape(problem.error.suggestedType)
            }
          );
        case 'missing_lat_long':
          return format(
            I18nImportValidation.single_column[problem.error.type],
            {
              resultColumnName: _.escape(problem.resultColumnName),
              coordinateType: _.escape(problem.error.coordinateType),
              missingCoordinateType: _.escape(problem.error.missingCoordinateType)
            }
          );
        default:
          return format(
            I18nImportValidation.single_column[problem.error.type],
            {
              resultColumnName: _.escape(problem.resultColumnName),
              ...capitalizeTypeNames(problem.error)
            }
          );
      }

    default:
      return null;

  }
}


function capitalizeTypeNames(singleColError: SingleColumnError): SingleColumnError {
  const cloned = _.cloneDeep(singleColError);
  if (cloned.suggestedType) {
    cloned.suggestedType = blist.datatypes[cloned.suggestedType].title;
  }
  if (cloned.chosenType) {
    cloned.chosenType = blist.datatypes[cloned.chosenType].title;
  }
  return cloned;
}


export function checkType(chosen: ST.TypeName, sourceCol: ST.SourceColumn): ?ValidationProblem {
  if (chosen === sourceCol.suggestion) {
    return null;
  } else if (isSubtypeOf(sourceCol.suggestion, chosen)) {
    return {
      type: 'type_too_generic',
      chosenType: chosen,
      suggestedType: sourceCol.suggestion
    };
  } else if (_.has(sourceCol.types, chosen)) {
    return {
      type: 'wrong_type',
      chosenType: chosen,
      suggestedType: sourceCol.suggestion,
      invalidPercent: Math.round(
        100 - getNumSuccessful(sourceCol, chosen) / sourceCol.processed * 100
      )
    };
  } else {
    return {
      type: 'wrong_type_unknown_count',
      chosenType: chosen,
      suggestedType: sourceCol.suggestion
    };
  }
}


const superTypes = {
  'html': 'text',
  'email': 'text',
  'url': 'text',
  'number': 'text',
  'calendar_date': 'text',
  'date': 'text',
  'checkbox': 'text',
  'stars': 'text',
  'money': 'number',
  'percent': 'number'
};

/** is `a` a subtype of `b`? */
function isSubtypeOf(a: ST.TypeName, b: ST.TypeName): boolean {
  return superTypes[a] === b || superTypes[superTypes[a]] === b;
}

function getNumSuccessful(sourceCol: ST.SourceColumn, typeName: ST.TypeName): number {
  return sourceCol.types[typeName];
}
