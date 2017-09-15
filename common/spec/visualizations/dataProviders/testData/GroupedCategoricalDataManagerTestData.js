module.exports = {
  // dimension values, order by measure desc
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 3': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 269],
      ["0.48", 22],
      ["0.33", 21]
    ]
  },
  // dimension values, order by measure asc
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ ASC NULL LAST LIMIT 3': {
    columns: ['dimension', 'measure'],
    rows: [
      ["0.01", 6],
      ["0.12", 7],
      ["0.28", 8]
    ]
  },
  // dimension values, order by dimension desc
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __dimension_alias__ DESC NULL LAST LIMIT 3': {
    columns: ['dimension', 'measure'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22]
    ]
  },
  // dimension values, order by dimension asc
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __dimension_alias__ ASC NULL LAST LIMIT 3': {
    columns: ['dimension', 'measure'],
    rows: [
      ["0.01", 6],
      ["0.02", 14],
      ["0.03", 11]
    ]
  },
  // grouping values, order by dimension desc
  'SELECT `plausibility` AS __dimension_alias__ GROUP BY `plausibility` ORDER BY __dimension_alias__ DESC LIMIT 3': {
    columns: ['dimension', 'measure'],
    rows: [
      ["10", undefined],
      ["9", undefined],
      ["8", undefined]
    ]
  },
  // grouping values, order by dimension asc
  'SELECT `plausibility` AS __dimension_alias__ GROUP BY `plausibility` ORDER BY __dimension_alias__ ASC LIMIT 3': {
    columns: ['dimension', 'measure'],
    rows: [
      ["1", undefined],
      ["2", undefined],
      ["3", undefined]
    ]
  },
  // Anteater: `blood_alcohol_level` IS NULL AND `plausibility` IN ('10', '9')
  'SELECT `blood_alcohol_level` AS __dimension_alias__, `plausibility` AS __grouping_alias__, COUNT(*) AS __measure_alias__ WHERE `blood_alcohol_level` IS NULL AND `plausibility` IN (\'10\', \'9\') GROUP BY `blood_alcohol_level`, __grouping_alias__ ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'grouping', 'measure'],
    rows: [
      [undefined, 10, 25],
      [undefined, 9, 31]
    ]
  },
  // Beaver: `blood_alcohol_level` IS NULL AND `plausibility` NOT IN ('10', '9')
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `blood_alcohol_level` IS NULL AND `plausibility` IS NOT NULL AND `plausibility` NOT IN (\'10\', \'9\') GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 213]
    ]
  },
  // Anteater: `blood_alcohol_level` IN ('0.5', '0.49') AND `plausibility` IN ('10', '9')
  'SELECT `blood_alcohol_level` AS __dimension_alias__, `plausibility` AS __grouping_alias__, COUNT(*) AS __measure_alias__ WHERE `blood_alcohol_level` IN (\'0.5\', \'0.49\') AND `plausibility` IN (\'10\', \'9\') GROUP BY `blood_alcohol_level`, __grouping_alias__ ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'grouping', 'measure'],
    rows: [
      ['0.5', 10, 1],
      ['0.49', 9, 2]
    ]
  },
  // Beaver: `blood_alcohol_level` IN ('0.5', '0.49') AND `plausibility` NOT IN ('10', '9')
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `blood_alcohol_level` IN (\'0.5\', \'0.49\') AND `plausibility` IS NOT NULL AND `plausibility` NOT IN (\'10\', \'9\') GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      ['0.5', 12],
      ['0.49', 9]
    ]
  },
  // Anteater: `blood_alcohol_level` IN ('0.48') AND `plausibility` IN ('10', '9')
  'SELECT `blood_alcohol_level` AS __dimension_alias__, `plausibility` AS __grouping_alias__, COUNT(*) AS __measure_alias__ WHERE `blood_alcohol_level` IN (\'0.48\') AND `plausibility` IN (\'10\', \'9\') GROUP BY `blood_alcohol_level`, __grouping_alias__ ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'grouping', 'measure'],
    rows: [
      ["0.48", 9, 3]
    ]
  },
  // Beaver: `blood_alcohol_level` IN ('0.48') AND `plausibility` NOT IN ('10', '9')
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `blood_alcohol_level` IN (\'0.48\') AND `plausibility` IS NOT NULL AND `plausibility` NOT IN (\'10\', \'9\') GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      ["0.48", 19]
    ]
  },
  // Anteater: `blood_alcohol_level` IN ('0.01', '0.02') AND `plausibility` IN ('1', '2')
  'SELECT `blood_alcohol_level` AS __dimension_alias__, `plausibility` AS __grouping_alias__, COUNT(*) AS __measure_alias__ WHERE `blood_alcohol_level` IN (\'0.01\', \'0.02\') AND `plausibility` IN (\'1\', \'2\') GROUP BY `blood_alcohol_level`, __grouping_alias__ ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'grouping', 'measure'],
    rows: []
  },
  // Beaver: `blood_alcohol_level` IN ('0.01', '0.02') AND `plausibility` NOT IN ('1', '2')
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `blood_alcohol_level` IN (\'0.01\', \'0.02\') AND `plausibility` IS NOT NULL AND `plausibility` NOT IN (\'1\', \'2\') GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      ["0.01", 6],
      ["0.02", 14]
    ]
  },
  // Anteater: `blood_alcohol_level` IN ('0.01', '0.12') AND `plausibility` IN ('1', '2')
  'SELECT `blood_alcohol_level` AS __dimension_alias__, `plausibility` AS __grouping_alias__, COUNT(*) AS __measure_alias__ WHERE `blood_alcohol_level` IN (\'0.01\', \'0.12\') AND `plausibility` IN (\'1\', \'2\') GROUP BY `blood_alcohol_level`, __grouping_alias__ ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'grouping', 'measure'],
    rows: [
      ["0.12", 2, 1]
    ]
  },
  // Beaver: `blood_alcohol_level` IN ('0.01', '0.12') AND `plausibility` NOT IN ('1', '2')
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `blood_alcohol_level` IN (\'0.01\', \'0.12\') AND `plausibility` IS NOT NULL AND `plausibility` NOT IN (\'1\', \'2\') GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      ["0.01", 6],
      ["0.12", 6]
    ]
  },
  // `blood_alcohol_level` IS NULL OR `blood_alcohol_level` = '0.48' other
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `plausibility` = \'10\' AND (`blood_alcohol_level` IS NOT NULL AND `blood_alcohol_level` != \'0.48\') GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      ["0.23", 5],
      ["0.43", 3],
      ["0.3", 3],
      ["0.18", 3],
      ["0.38", 3],
      ["0.39", 3],
      ["0.46", 3],
      ["0.17", 3],
      ["0.44", 2],
      ["0.09", 2],
      ["0.14", 2],
      ["0.37", 2],
      ["0.32", 2],
      ["0.04", 2],
      ["0.13", 2],
      ["0.06", 2],
      ["0.28", 2],
      ["0.35", 2],
      ["0.27", 2],
      ["0.2", 2],
      ["0.21", 1],
      ["0.33", 1],
      ["0.02", 1],
      ["0.08", 1],
      ["0.11", 1],
      ["0.36", 1],
      ["0.4", 1],
      ["0.07", 1],
      ["0.31", 1],
      ["0.34", 1],
      ["0.5", 1],
      ["0.47", 1],
      ["0.01", 1],
      ["0.1", 1],
      ["0.29", 1],
      ["0.45", 1],
      ["0.05", 1]
    ]
  },
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `plausibility` = \'9\' AND (`blood_alcohol_level` IS NOT NULL AND `blood_alcohol_level` != \'0.48\') GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      ["0.06", 5],
      ["0.15", 4],
      ["0.24", 3],
      ["0.16", 3],
      ["0.4", 3],
      ["0.46", 3],
      ["0.33", 3],
      ["0.34", 2],
      ["0.49", 2],
      ["0.23", 2],
      ["0.45", 2],
      ["0.43", 2],
      ["0.37", 2],
      ["0.44", 2],
      ["0.11", 2],
      ["0.42", 2],
      ["0.17", 2],
      ["0.35", 2],
      ["0.03", 1],
      ["0.27", 1],
      ["0.13", 1],
      ["0.2", 1],
      ["0.36", 1],
      ["0.14", 1],
      ["0.31", 1],
      ["0.07", 1],
      ["0.32", 1],
      ["0.47", 1],
      ["0.38", 1],
      ["0.18", 1],
      ["0.12", 1],
      ["0.29", 1],
      ["0.41", 1],
      ["0.09", 1],
      ["0.08", 1],
      ["0.1", 1],
      ["0.19", 1],
      ["0.22", 1]
    ]
  },
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE (`plausibility` != \'10\' OR `plausibility` IS NULL ) AND (`plausibility` != \'9\' OR `plausibility` IS NULL ) AND (`blood_alcohol_level` IS NOT NULL AND `blood_alcohol_level` != \'0.48\') GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      ["0.32", 18],
      ["0.15", 17],
      ["0.33", 17],
      ["0.08", 16],
      ["0.07", 16],
      ["0.09", 15],
      ["0.05", 15],
      ["0.41", 15],
      ["0.42", 14],
      ["0.4", 14],
      ["0.44", 14],
      ["0.29", 14],
      ["0.25", 14],
      ["0.45", 14],
      ["0.19", 14],
      ["0.11", 13],
      ["0.21", 13],
      ["0.37", 13],
      ["0.23", 13],
      ["0.27", 13],
      ["0.02", 13],
      ["0.26", 12],
      ["0.24", 12],
      ["0.36", 12],
      ["0.47", 12],
      ["0.5", 12],
      ["0.18", 12],
      ["0.46", 12],
      ["0.35", 12],
      ["0.13", 11],
      ["0.14", 11],
      ["0.1", 11],
      ["0.34", 11],
      ["0.43", 11],
      ["0.03", 10],
      ["0.16", 10],
      ["0.22", 10],
      ["0.04", 9],
      ["0.39", 9],
      ["0.3", 9],
      ["0.49", 9],
      ["0.2", 8],
      ["0.06", 8],
      ["0.38", 8],
      ["0.31", 7],
      ["0.17", 6],
      ["0.12", 6],
      ["0.28", 6],
      ["0.01", 5]
    ]
  },
  // `blood_alcohol_level` = '0.01' OR `blood_alcohol_level` = '0.12' other
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `plausibility` = \'1\' AND (`blood_alcohol_level` != \'0.01\' OR `blood_alcohol_level` IS NULL ) AND (`blood_alcohol_level` != \'0.12\' OR `blood_alcohol_level` IS NULL ) GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 26],
      ["0.19", 6],
      ["0.32", 4],
      ["0.44", 3],
      ["0.4", 3],
      ["0.47", 2],
      ["0.09", 2],
      ["0.3", 2],
      ["0.36", 2],
      ["0.14", 2],
      ["0.29", 2],
      ["0.33", 2],
      ["0.45", 2],
      ["0.15", 2],
      ["0.46", 2],
      ["0.41", 2],
      ["0.21", 2],
      ["0.1", 1],
      ["0.43", 1],
      ["0.27", 1],
      ["0.31", 1],
      ["0.07", 1],
      ["0.06", 1],
      ["0.24", 1],
      ["0.04", 1],
      ["0.11", 1],
      ["0.26", 1],
      ["0.18", 1],
      ["0.2", 1],
      ["0.05", 1],
      ["0.5", 1],
      ["0.39", 1],
      ["0.42", 1],
      ["0.35", 1]
    ]
  },
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `plausibility` = \'2\' AND (`blood_alcohol_level` != \'0.01\' OR `blood_alcohol_level` IS NULL ) AND (`blood_alcohol_level` != \'0.12\' OR `blood_alcohol_level` IS NULL ) GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 19],
      ["0.42", 4],
      ["0.24", 4],
      ["0.43", 4],
      ["0.09", 3],
      ["0.34", 3],
      ["0.27", 3],
      ["0.48", 2],
      ["0.36", 2],
      ["0.33", 2],
      ["0.23", 2],
      ["0.26", 2],
      ["0.08", 2],
      ["0.11", 2],
      ["0.21", 2],
      ["0.39", 1],
      ["0.47", 1],
      ["0.1", 1],
      ["0.31", 1],
      ["0.06", 1],
      ["0.3", 1],
      ["0.2", 1],
      ["0.07", 1],
      ["0.45", 1],
      ["0.04", 1],
      ["0.15", 1],
      ["0.22", 1],
      ["0.46", 1],
      ["0.41", 1],
      ["0.5", 1],
      ["0.18", 1],
      ["0.29", 1],
      ["0.25", 1],
      ["0.13", 1],
      ["0.49", 1]
    ]
  },
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE (`plausibility` != \'1\' OR `plausibility` IS NULL ) AND (`plausibility` != \'2\' OR `plausibility` IS NULL ) AND (`blood_alcohol_level` != \'0.01\' OR `blood_alcohol_level` IS NULL ) AND (`blood_alcohol_level` != \'0.12\' OR `blood_alcohol_level` IS NULL ) GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 224],
      ["0.48", 20],
      ["0.23", 18],
      ["0.15", 18],
      ["0.33", 17],
      ["0.37", 17],
      ["0.32", 17],
      ["0.07", 16],
      ["0.08", 16],
      ["0.44", 15],
      ["0.4", 15],
      ["0.35", 15],
      ["0.46", 15],
      ["0.05", 15],
      ["0.45", 14],
      ["0.18", 14],
      ["0.02", 14],
      ["0.06", 13],
      ["0.41", 13],
      ["0.09", 13],
      ["0.11", 13],
      ["0.29", 13],
      ["0.25", 13],
      ["0.13", 13],
      ["0.16", 13],
      ["0.38", 12],
      ["0.27", 12],
      ["0.14", 12],
      ["0.03", 11],
      ["0.43", 11],
      ["0.34", 11],
      ["0.5", 11],
      ["0.47", 11],
      ["0.1", 11],
      ["0.17", 11],
      ["0.42", 11],
      ["0.49", 10],
      ["0.24", 10],
      ["0.36", 10],
      ["0.39", 10],
      ["0.21", 10],
      ["0.22", 10],
      ["0.19", 9],
      ["0.26", 9],
      ["0.04", 9],
      ["0.3", 9],
      ["0.2", 9],
      ["0.28", 8],
      ["0.31", 7]
    ]
  },
  // `blood_alcohol_level` = '0.01' OR `blood_alcohol_level` = '0.02' other
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `plausibility` = \'1\' AND (`blood_alcohol_level` != \'0.01\' OR `blood_alcohol_level` IS NULL ) AND (`blood_alcohol_level` != \'0.02\' OR `blood_alcohol_level` IS NULL ) GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 26],
      ["0.19", 6],
      ["0.32", 4],
      ["0.44", 3],
      ["0.4", 3],
      ["0.15", 2],
      ["0.09", 2],
      ["0.3", 2],
      ["0.36", 2],
      ["0.14", 2],
      ["0.45", 2],
      ["0.47", 2],
      ["0.29", 2],
      ["0.46", 2],
      ["0.41", 2],
      ["0.33", 2],
      ["0.21", 2],
      ["0.27", 1],
      ["0.26", 1],
      ["0.1", 1],
      ["0.2", 1],
      ["0.05", 1],
      ["0.43", 1],
      ["0.06", 1],
      ["0.11", 1],
      ["0.24", 1],
      ["0.39", 1],
      ["0.31", 1],
      ["0.42", 1],
      ["0.07", 1],
      ["0.35", 1],
      ["0.5", 1],
      ["0.18", 1],
      ["0.04", 1]
    ]
  },
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `plausibility` = \'2\' AND (`blood_alcohol_level` != \'0.01\' OR `blood_alcohol_level` IS NULL ) AND (`blood_alcohol_level` != \'0.02\' OR `blood_alcohol_level` IS NULL ) GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 19],
      ["0.42", 4],
      ["0.24", 4],
      ["0.43", 4],
      ["0.09", 3],
      ["0.34", 3],
      ["0.27", 3],
      ["0.48", 2],
      ["0.36", 2],
      ["0.33", 2],
      ["0.23", 2],
      ["0.26", 2],
      ["0.08", 2],
      ["0.11", 2],
      ["0.21", 2],
      ["0.39", 1],
      ["0.47", 1],
      ["0.1", 1],
      ["0.31", 1],
      ["0.06", 1],
      ["0.3", 1],
      ["0.2", 1],
      ["0.07", 1],
      ["0.45", 1],
      ["0.04", 1],
      ["0.12", 1],
      ["0.15", 1],
      ["0.22", 1],
      ["0.46", 1],
      ["0.41", 1],
      ["0.5", 1],
      ["0.18", 1],
      ["0.29", 1],
      ["0.25", 1],
      ["0.13", 1],
      ["0.49", 1]
    ]
  },
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE (`plausibility` != \'1\' OR `plausibility` IS NULL ) AND (`plausibility` != \'2\' OR `plausibility` IS NULL ) AND (`blood_alcohol_level` != \'0.01\' OR `blood_alcohol_level` IS NULL ) AND (`blood_alcohol_level` != \'0.02\' OR `blood_alcohol_level` IS NULL ) GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 224],
      ["0.48", 20],
      ["0.15", 18],
      ["0.23", 18],
      ["0.33", 17],
      ["0.37", 17],
      ["0.32", 17],
      ["0.08", 16],
      ["0.07", 16],
      ["0.4", 15],
      ["0.05", 15],
      ["0.46", 15],
      ["0.44", 15],
      ["0.35", 15],
      ["0.18", 14],
      ["0.45", 14],
      ["0.25", 13],
      ["0.29", 13],
      ["0.16", 13],
      ["0.41", 13],
      ["0.09", 13],
      ["0.06", 13],
      ["0.11", 13],
      ["0.13", 13],
      ["0.38", 12],
      ["0.27", 12],
      ["0.14", 12],
      ["0.43", 11],
      ["0.1", 11],
      ["0.47", 11],
      ["0.03", 11],
      ["0.34", 11],
      ["0.42", 11],
      ["0.17", 11],
      ["0.5", 11],
      ["0.49", 10],
      ["0.22", 10],
      ["0.24", 10],
      ["0.21", 10],
      ["0.39", 10],
      ["0.36", 10],
      ["0.19", 9],
      ["0.3", 9],
      ["0.26", 9],
      ["0.04", 9],
      ["0.2", 9],
      ["0.28", 8],
      ["0.31", 7],
      ["0.12", 6]
    ]
  },
  // `blood_alcohol_level` = '0.5' OR `blood_alcohol_level` = '0.49' other
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `plausibility` = \'10\' AND (`blood_alcohol_level` != \'0.5\' OR `blood_alcohol_level` IS NULL ) AND (`blood_alcohol_level` != \'0.49\' OR `blood_alcohol_level` IS NULL ) GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 25],
      ["0.23", 5],
      ["0.46", 3],
      ["0.3", 3],
      ["0.38", 3],
      ["0.18", 3],
      ["0.17", 3],
      ["0.39", 3],
      ["0.43", 3],
      ["0.28", 2],
      ["0.09", 2],
      ["0.44", 2],
      ["0.27", 2],
      ["0.35", 2],
      ["0.13", 2],
      ["0.06", 2],
      ["0.2", 2],
      ["0.14", 2],
      ["0.37", 2],
      ["0.04", 2],
      ["0.32", 2],
      ["0.34", 1],
      ["0.36", 1],
      ["0.31", 1],
      ["0.45", 1],
      ["0.07", 1],
      ["0.47", 1],
      ["0.21", 1],
      ["0.01", 1],
      ["0.29", 1],
      ["0.33", 1],
      ["0.02", 1],
      ["0.08", 1],
      ["0.11", 1],
      ["0.4", 1],
      ["0.1", 1],
      ["0.05", 1]
    ]
  },
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `plausibility` = \'9\' AND (`blood_alcohol_level` != \'0.5\' OR `blood_alcohol_level` IS NULL ) AND (`blood_alcohol_level` != \'0.49\' OR `blood_alcohol_level` IS NULL ) GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 31],
      ["0.06", 5],
      ["0.15", 4],
      ["0.16", 3],
      ["0.48", 3],
      ["0.33", 3],
      ["0.4", 3],
      ["0.46", 3],
      ["0.24", 3],
      ["0.23", 2],
      ["0.42", 2],
      ["0.34", 2],
      ["0.37", 2],
      ["0.17", 2],
      ["0.43", 2],
      ["0.44", 2],
      ["0.35", 2],
      ["0.45", 2],
      ["0.11", 2],
      ["0.19", 1],
      ["0.22", 1],
      ["0.09", 1],
      ["0.2", 1],
      ["0.36", 1],
      ["0.14", 1],
      ["0.31", 1],
      ["0.47", 1],
      ["0.18", 1],
      ["0.29", 1],
      ["0.13", 1],
      ["0.1", 1],
      ["0.03", 1],
      ["0.27", 1],
      ["0.07", 1],
      ["0.32", 1],
      ["0.38", 1],
      ["0.12", 1],
      ["0.41", 1],
      ["0.08", 1]
    ]
  },
  'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE (`plausibility` != \'10\' OR `plausibility` IS NULL ) AND (`plausibility` != \'9\' OR `plausibility` IS NULL ) AND (`blood_alcohol_level` != \'0.5\' OR `blood_alcohol_level` IS NULL ) AND (`blood_alcohol_level` != \'0.49\' OR `blood_alcohol_level` IS NULL ) GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      [undefined, 213],
      ["0.48", 19],
      ["0.32", 18],
      ["0.15", 17],
      ["0.33", 17],
      ["0.07", 16],
      ["0.08", 16],
      ["0.09", 15],
      ["0.05", 15],
      ["0.41", 15],
      ["0.29", 14],
      ["0.25", 14],
      ["0.4", 14],
      ["0.42", 14],
      ["0.45", 14],
      ["0.44", 14],
      ["0.19", 14],
      ["0.37", 13],
      ["0.11", 13],
      ["0.02", 13],
      ["0.23", 13],
      ["0.27", 13],
      ["0.21", 13],
      ["0.36", 12],
      ["0.24", 12],
      ["0.47", 12],
      ["0.18", 12],
      ["0.35", 12],
      ["0.26", 12],
      ["0.46", 12],
      ["0.1", 11],
      ["0.13", 11],
      ["0.14", 11],
      ["0.34", 11],
      ["0.43", 11],
      ["0.16", 10],
      ["0.03", 10],
      ["0.22", 10],
      ["0.39", 9],
      ["0.3", 9],
      ["0.04", 9],
      ["0.06", 8],
      ["0.2", 8],
      ["0.38", 8],
      ["0.31", 7],
      ["0.17", 6],
      ["0.12", 6],
      ["0.28", 6],
      ["0.01", 5]

    ]
  },
  // measure sum instead of count(*)
  'SELECT `blood_alcohol_level` AS __dimension_alias__, SUM(`plausibility`) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 3': {
    columns: ['dimension', 'measure'],
    rows: [
      ['0.01', 10],
      ['0.05', 5],
    ]
  },
  // Anteater
  'SELECT `blood_alcohol_level` AS __dimension_alias__, `plausibility` AS __grouping_alias__, SUM(`plausibility`) AS __measure_alias__ WHERE `blood_alcohol_level` IN (\'0.01\', \'0.05\') AND `plausibility` IN (\'10\', \'9\') GROUP BY `blood_alcohol_level`, __grouping_alias__ ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'grouping', 'measure'],
    rows: [
      ['0.01', 10, 3],
      ['0.05', 10, 7],
      ['0.01', 9, 9],
      ['0.05', 9, 11]
    ]
  },
  // Beaver
  'SELECT `blood_alcohol_level` AS __dimension_alias__, SUM(`plausibility`) AS __measure_alias__ WHERE `blood_alcohol_level` IN (\'0.01\', \'0.05\') AND `plausibility` IS NOT NULL AND `plausibility` NOT IN (\'10\', \'9\') GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 1001': {
    columns: ['dimension', 'measure'],
    rows: [
      ['0.01', 100],
      ['0.05', 200],
    ]
  }
};
