module.exports = function Mockumentary(Page, Dataset, Card) {

  function createCardMetadata(cardOptions) {
    var minimalInitialValues = {
      fieldName: 'blood_alcohol_level',
      cardSize: 2,
      cardType: 'column',
      expanded: false,
      computedColumn: null,
      aggregationField: null,
      aggregationFunction: null,
      activeFilters: [
        {
          'function': 'BinaryOperator',
          arguments: {
            operand: 0.12,
            operator: '='
          }
        }
      ]
    };

    return $.extend(true, minimalInitialValues, cardOptions);
  }

  function createCard(page, fieldName, cardOptions) {
    return new Card(page, fieldName, cardOptions);
  }

  function createPageMetadata(pageOptions) {

    var minimalPageMetadata = {
      cards: [],
      datasetId: 'asdf-fdsa',
      description: 'Description',
      name: 'Name',
      pageId: 'page-page',
      moderationStatus: true,
      hideFromCatalog: false,
      hideFromDataJson: false,
      permissions: {
        isPublic: true
      },
      primaryAmountField: null,
      primaryAggregation: null,
      version: 4
    };

    return _.merge(minimalPageMetadata, pageOptions);
  }

  function createPage(pageOptions, datasetOptions) {

    var pageMetadata = createPageMetadata(pageOptions);

    return new Page(pageMetadata, createDataset(datasetOptions));
  }

  function createDatasetMetadata(datasetOptions) {

    var minimalDatasetMetadata = {
      id: 'asdf-fdsa',
      name: 'test dataset name',
      rowDisplayUnit: 'row',
      ownerId: 'fdsa-asdf',
      updatedAt: '2004-05-20T17:42:55+00:00',
      locale: 'en_US',
      columns: {},
      permissions: {
        isPublic: true
      },
      version: 1
    };

    return $.extend(true, minimalDatasetMetadata, datasetOptions);
  }

  function createDataset(datasetOptions, migrationOptions) {

    var datasetMetadata = createDatasetMetadata(datasetOptions);

    // We allow the migration metadata to be injected either
    //
    // 1) with the default values below,
    // 2) via the datasetOptions themselves [for old tests that would require tedious plumbing to accept another argument], or
    // 3) via the migrationOptions here [for new tests that are written with the knowledge of this argument].
    //
    // Components should exhibit the intended behaviors for *not* having an OBE counterpart
    // if you assign `obeId: null` on either datasetOptions or migrationOptions.
    // If you discover otherwise, it may be time to pay down some testing tech debt.
    var migrationMetadata = _.extend({
      nbeId: 'four-four',
      obeId: 'asdf-fdsa'
    }, datasetOptions, migrationOptions);

    return new Dataset(datasetMetadata, migrationMetadata);
  }

  return {
    createPageMetadata: createPageMetadata,
    createCardMetadata: createCardMetadata,
    createCard: createCard,
    createPage: createPage,
    createDatasetMetadata: createDatasetMetadata,
    createDataset: createDataset
  };
};
