import * as SharedTypes from './sharedTypes';


export function addColumnIndicesToSummary(summary: SharedTypes.Summary): SharedTypes.Summary {
  if (summary.columns) {
    return {
      ...summary,
      columns: summary.columns.map((col, idx) => ({ ...col, index: idx }))
    };
  } else {
    return summary;
  }
}
