import _ from 'lodash';
import Showdown from 'showdown';

import StorytellerUtils from '../StorytellerUtils';
import httpRequest from '../services/httpRequest';
import Actions from './Actions';
import { dispatcher } from './Dispatcher';
import I18n from './I18n';
import Environment from '../StorytellerEnvironment';

const converter = new Showdown.converter(); //eslint-disable-line new-cap
const urlMatcher = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:''.,<>?«»“”‘’]))/ig;

export default function GoalMigrationRunner(narrativeMigrationMetadata, storyData) {
  StorytellerUtils.assert(narrativeMigrationMetadata, 'Narrative data must be provided.');
  StorytellerUtils.assert(storyData, 'Story data must be provided.');
  this.run = () => {
    dispatcher.dispatch({
      action: Actions.GOAL_MIGRATION_START
    });

    const hasRetirementNarrative = !_.isEmpty(narrativeMigrationMetadata.retirement_narrative);

    const hasTwoColumn = hasTwoColumnLayout(narrativeMigrationMetadata.narrative);
    const hasMismatchedTwoColumn = hasMismatchedTwoColumnLayout(narrativeMigrationMetadata.narrative);

    prefetchDataNeededForMigration(narrativeMigrationMetadata.narrative).then(
      (narrative) => {
        // generate blocks from narrative sections.
        //
        // because a two-column section can generate more than one block,
        // we wrap each section's output blocks in an array, then unwrap
        // them to concatenate the blocks correctly.
        const narrativeBlocks = _(narrative).
          map(mapSectionToComponents).
          flattenDepth(1).
          compact().
          map(mapComponentsToBlocks).
          value();

        const goalBlock = {
          layout: '12',
          presentable: true,
          components: [{
            type: 'goal.embed',
            value: {
              domain: window.location.hostname,
              category: Environment.OP_CATEGORY_UID,
              dashboard: Environment.OP_DASHBOARD_UID,
              uid: Environment.STORY_UID
            }
          }]
        };

        narrativeBlocks.unshift(goalBlock);

        const migrationSummary = {
          hasRetirementNarrative,
          narrativeBlocks,
          hasTwoColumn,
          hasMismatchedTwoColumn
        };

        dispatcher.dispatch({
          action: Actions.GOAL_MIGRATION_END,
          story: _.merge({}, storyData, {
            blocks: migrationSummary.narrativeBlocks
          })
        });
      },
      (error) => {
        dispatcher.dispatch({
          action: Actions.GOAL_MIGRATION_ERROR,
          error: error
        });
      }
    );
  };

}

// Some sections need data from external APIs. Instead of
// making the already-complex migration logic more complex
// by introducing asynchronicity, we instead prefetch all
// data we expect to need and place it directly in the
// narrative data. This allows us to keep the
// other migration logic fully synchronous and avoids
// the need to pass some cache object around.
function prefetchDataNeededForMigration(sections) {
  function prefetchSection(section) {
    if (section.type === 'viz') {
      return httpRequest('GET', `https://${window.location.hostname}/api/views/${section.dataset}.json`).
        then((data) => section.dataset = data );
    } else if (section.type === 'twoColLayout') {
      return Promise.all([
        prefetchDataNeededForMigration(section.columns[0]),
        prefetchDataNeededForMigration(section.columns[1])
      ]).then(_.union);
    } else {
      return Promise.resolve(section);
    }
  }

  return Promise.all(
    _.map(sections, prefetchSection)
  ).then(_.constant(sections)); // Ignore promise resolutions, we just want to return sections.
}

// SECTION MIGRATION LOGIC
//
// All of these functions accept a narrative section and produce one or more
// blocks with one or more components.

function migrateTextSection(section) {
  // Current strategy: migrate Showdown output directly, and let Squire re-write
  // to meet its own needs.
  if (section.text) {
    const correctMarkdown = escapeMarkdownLinks(section.text);
    const html = linkify(converter.makeHtml(correctMarkdown));
    return [{
      type: 'html',
      value: html
    }];
  } else {
    return [];
  }
}

function migrateImageSection(section) {
  if (section.src) {
    return [{
      type: 'image',
      value: {
        url: section.src, // TODO: normally this has the domain prepended
        documentId: null // TODO: are we backfilling this?
      }
    }];
  } else {
    return [];
  }
}

function migrateVizSection(section) {
  const displayType = section.dataset.displayType;
  const isGrouped = _.get(section.dataset, 'query.groupBys.length', 0) > 0;
  if (!isGrouped && displayType === 'table') {
    const defaultSortColumn = section.dataset.columns[0];
    const unit = I18n.t('editor.visualizations.default_unit');
    const vif = {
      title: section.dataset.name,
      format: {
        type: 'visualization_interchange_format',
        version: 2
      },
      description: section.dataset.description || '',
      configuration: {
        order: [{
          ascending: true,
          columnName: defaultSortColumn.fieldName
        }]
      },
      series: [
        {
          color: {
          },
          dataSource: {
            datasetUid: section.dataset.id,
            dimension: {
              columnName: null,
              aggregationFunction: null
            },
            domain: window.location.hostname,
            measure: {
              columnName: null,
              aggregationFunction: 'count'
            },
            type: 'socrata.soql',
            filters: []
          },
          label: null,
          type: 'table',
          unit: unit
        }
      ],
      origin: {
        url: window.location.toString().replace(/\/edit$/, ''),
        type: 'storyteller_goal_migration'
      }
    };
    return [{
      type: 'socrata.visualization.table',
      value: {
        vif: vif,
        dataset: section.dataset.id,
        originalUid: section.dataset.id
      }
    }];
  } else {
    return [{
      type: 'socrata.visualization.classic',
      value: {
        dataset: {
          domain: window.location.hostname,
          datasetUid: section.dataset.id
        },
        originalUid: section.dataset.id,
        visualization: section.dataset
      }
    }];
  }
}

// to determine what kind of block each position should generate, we scan each
// position of both columns and determine what block type to generate, if any
// match exists. if no match exists, abort and try a fallback.
function migrateTwoColSection(section) {
  const typedRows = mapColumnsToTypedRows(section.columns);

  let isHandlingMismatched = false;

  return _.reduceRight(typedRows, (accum, typedRow) => {
    const block = mapTypedRowToBlock(typedRow);

    switch (typedRow.type) {
      case 'text-text':
      case 'viz-viz':
      case 'image-image':
      case 'text-image':
      case 'text-viz':
      case 'image-text':
      case 'viz-text':
        if (isHandlingMismatched) {
          // getting from mismatched case to normal case:
          // disassemble the split block and create two distinct blocks.
          // this is just a heuristic; i can explain its rationale, but
          // there are other possibilities we can consider.
          accum.unshift([block.pop()]);
          accum.unshift([block.pop()]);
          isHandlingMismatched = false;
        } else {
          // normal case
          accum.unshift(block);
        }
        break;
      default:
        // mismatched case
        isHandlingMismatched = true;
        accum.unshift(_.compact(block));
    }

    return accum;
  }, []);
}

// helper to map the various narrative section types to block generators.
function mapSectionToComponents(section) {
  switch (section.type) {
    case 'text':
      return [migrateTextSection(section)];
    case 'viz':
      return [migrateVizSection(section)];
    case 'image':
      return [migrateImageSection(section)];
    case 'twoColLayout':
      // this comes pre-wrapped in an array
      return migrateTwoColSection(section);
    default:
      throw `unrecognized narrative section: ${section.type}`;
  }
}

// Given a list of components, figure out what the block
// should be (layout, etc).
function mapComponentsToBlocks(components) {

  let block = { components };

  switch (components.length) {
    case 1:
      block.layout = '12';
      break;
    case 2:
      block.layout = '6-6';
      break;
    default:
      throw 'Block is empty or has more than two children. Layout not defined.';
  }

  return block;
}

// helper to map the interally generated "typed rows" to block generators.
function mapTypedRowToBlock(typedRow) {
  const rowA = typedRow.rows[0];
  const rowB = typedRow.rows[1];

  switch (typedRow.type) {
    // text + text
    case 'text-text':
      return migrateTextSection(rowA).concat(migrateTextSection(rowB));

    // rich media + rich media
    case 'viz-viz':
      return migrateVizSection(rowA).concat(migrateVizSection(rowB));
    case 'image-image':
      return migrateImageSection(rowA).concat(migrateImageSection(rowB));
    case 'viz-image':
      return migrateVizSection(rowA).concat(migrateImageSection(rowB));
    case 'image-viz':
      return migrateImageSection(rowA).concat(migrateVizSection(rowB));

    // text + rich media
    case 'text-viz':
      return migrateTextSection(rowA).concat(migrateVizSection(rowB));
    case 'text-image':
      return migrateTextSection(rowA).concat(migrateImageSection(rowB));

    // rich media + text
    case 'viz-text':
      return migrateVizSection(rowA).concat(migrateTextSection(rowB));
    case 'image-text':
      return migrateImageSection(rowA).concat(migrateTextSection(rowB));

    default:
      if (/(^-|-$)/.test(typedRow.type)) {
        // unequal columns, only one sub-section at this index instead of two
        const section = _.compact(typedRow.rows).pop();
        return mapSectionToComponents(section).pop();
      } else {
        // TODO: define fallback cases for anything that comes up here
        throw `unhandled row from two-column layout: ${typedRow.type}`;
      }
  }
}

// helper to get from columns to a structure that's usable for blocks
function mapColumnsToTypedRows(columns) {
  const rows = _.zip.apply(null, columns);

  const blockTypes = rows.map((row) => _.map(row, 'type').join('-'));

  return _.map(
    _.zip(blockTypes, rows),
    _.partial(_.zipObject, ['type', 'rows'])
  );
}

// standalone check for twoCol sections
function hasTwoColumnLayout(narrative) {
  return _.some(narrative, {type: 'twoColLayout'});
}

// standalone check for twoCol sections with unequal length of columns
function hasMismatchedTwoColumnLayout(narrative) {
  return _.some(
    _.filter(narrative, {type: 'twoColLayout'}),
    (section) => section.columns[0].length !== section.columns[1].length
  );
}

// helper to prevent URLs containing underscores from being mis-parsed
// (mostly a direct port from frontend, see markdown-utils.js and autolinker.js)
function escapeMarkdownLinks(markdown) {
  markdown = markdown || '';
  const locOfToc = markdown.search(/^\[\d+\]: [^\s]+$/m);
  let escapedSection = '';
  let plainSection = '';
  if (locOfToc > 0) {
    escapedSection = markdown.substr(0, locOfToc);
    plainSection = markdown.substr(locOfToc);
  } else {
    escapedSection = markdown;
  }

  escapedSection = escapedSection.replace(urlMatcher, (url) => url.replace(/_/g, '\\_'));

  return escapedSection + plainSection;
}

// helper to auto-generate links from text that looks like a URL
function linkify(html) {
  return html; // TODO implement later
}
