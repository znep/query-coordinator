import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import { GeocodeShortcut } from 'datasetManagementUI/components/GeocodeShortcut/GeocodeShortcut';
import entities from 'data/entities';
import * as Selectors from 'datasetManagementUI/selectors';

window.serverConfig.featureFlags.ingress_strategy = 'obe';

describe('components/GeocodeShortcut', () => {
  const defaultProps = {
    displayState: {
      type: 'NORMAL',
      pageNo: 1,
      outputSchemaId: 137
    },
    params: {
      fourfour: 'ky4m-3w3d',
      sourceId: 114,
      inputSchemaId: 97,
      outputSchemaId: 137
    },
    view: entities.views['ky4m-3w3d'],
    inputSchema: entities.input_schemas[97],
    inputColumns: Selectors.columnsForInputSchema(entities, 97),
    outputSchema: entities.output_schemas[137],
    outputColumns: Selectors.columnsForOutputSchema(entities, 137),
    allOutputColumns: Selectors.outputColumnsForInputSchemaUniqByTransform(entities, 97),
    isPreviewable: false,
    anySelected: false,
    toggleConvertToNull: _.noop,
    toggleHideOriginal: _.noop,
    setComposedFrom: _.noop,
    setMapping: _.noop,
    formState: {
      shouldHideOriginal: true,
      shouldConvertToNull: false
    },
    showError: _.noop,
    newOutputSchema: _.noop,
    redirectGeocodePane: _.noop,
    entities
  };

  it('renders', () => {
    const component = shallow(<GeocodeShortcut {...defaultProps} />);
    assert.isTrue(component.find('ColumnPreview').exists());
  });
});
