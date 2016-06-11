import { update, SHAPEFILE_UPDATE_LAYER, updateLayerAction } from 'components/importShapefile';
import { FILE_UPLOAD_COMPLETE, fileUploadComplete } from 'components/uploadFile';

describe('importShapefile reducer', () => {
  const defaultLayers = [
    {
      name: "prosperity_regions_generalized",
      referenceSystem: "NAD_1983_Michigan_GeoRef_Meters"
    },
    {
      name: "service_delivery_generalized",
      referenceSystem: "NAD_1983_Michigan_GeoRef_Meters"
    }
  ];

  describe(FILE_UPLOAD_COMPLETE, () => {
    // TODO: add tests that verify nothing happens for uploading a dataset
    it('saves layers when the file upload is for a shapefile', () => {
      const stateAfter = update(null, fileUploadComplete('random-file-id', { layers: defaultLayers}));
      expect(stateAfter).to.deep.equal(defaultLayers);
    });
  });

  describe(SHAPEFILE_UPDATE_LAYER, () => {
    it('updates individual layer names when updateLayerAction is called', () => {
      const stateAfter = update(defaultLayers, updateLayerAction(0, 'new_layer_name'));
      expect(stateAfter[0]).to.deep.equal({
        name: 'new_layer_name',
        referenceSystem: 'NAD_1983_Michigan_GeoRef_Meters'
      });
    });
  });
});
