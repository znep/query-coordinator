require 'rails_helper'

describe DisplayFormat do
  include TestHelperMethods

  describe 'visualization_canvas_metadata' do
    it 'returns visualizationCanvasMetadata' do
      mock_vifs = [
        { 'title' => 'orange', 'format' => { 'version' => 2 }, 'series' => [] },
        { 'title' => 'pink', 'format' => { 'version' => 2 }, 'series' => [] }
      ]
      data = {
        'visualizationCanvasMetadata' => {
          :vifs => mock_vifs
        }
      }
      metadata = DisplayFormat.new(data).visualization_canvas_metadata

      expect(metadata[:vifs]).to eq(mock_vifs)
    end

    it 'returns default metadata if none defined' do
      metadata = DisplayFormat.new.visualization_canvas_metadata

      expect(metadata[:vifs]).to eq([])
      expect(metadata[:version]).to eq(1)
    end

    context 'restoring the required metadata that Core strips out' do
      it 'returns an error if any of the VIF versions are not 2' do
        mock_vifs = [
          { 'title' => 'orange', 'format' => { 'version' => 1 }, 'series' => [] },
          { 'title' => 'pink', 'format' => { 'version' => 1 }, 'series' => [] }
        ]
        data = {
          'visualizationCanvasMetadata' => {
            :vifs => mock_vifs
          }
        }

        expect { DisplayFormat.new(data).visualization_canvas_metadata }.to raise_error(ArgumentError)
      end

      it 'restores a missing series.label in VIFs' do
        data = {
          'visualizationCanvasMetadata' => {
            'vifs' => [
              {
                'format' => {
                  'type' => 'visualization_interchange_format',
                  'version' => 2
                },
                'title' => 'Outer Orbit Adventures',
                'description' => 'Elephants in Space',
                'series' => [
                  {
                    'dataSource' => {
                      'datasetUid' => 'elep-hant',
                      'dimension' => {
                        'columnName' => 'dreamers'
                      },
                      'domain' => 'vertex-stories.test-socrata.com',
                      'type' => 'socrata.soql'
                    }
                  }
                ]
              }
            ]
          }
        }
        metadata = DisplayFormat.new(data).visualization_canvas_metadata

        expect(metadata[:vifs][0][:series][0]).to have_key(:label)
      end

      it 'restores a missing filter array in VIFs' do
        data = {
          'visualizationCanvasMetadata' => {
            'vifs' => [
              {
                'format' => {
                  'type' => 'visualization_interchange_format',
                  'version' => 2
                },
                'title' => 'Outer Orbit Adventures',
                'description' => 'Elephants in Space',
                'series' => [
                  {
                    'dataSource' => {
                      'datasetUid' => 'elep-hant',
                      'dimension' => {
                        'columnName' => 'dreamers'
                      },
                      'domain' => 'vertex-stories.test-socrata.com',
                      'type' => 'socrata.soql'
                    }
                  }
                ]
              }
            ]
          }
        }
        metadata = DisplayFormat.new(data).visualization_canvas_metadata

        expect(metadata[:vifs][0][:series][0][:dataSource][:filters]).to eq([])
      end

      it 'restores the arguments property for noop filters in VIFs' do
        data = {
          'visualizationCanvasMetadata' => {
            'vifs' => [
              {
                'format' => {
                  'type' => 'visualization_interchange_format',
                  'version' => 2
                },
                'title' => 'Outer Orbit Adventures',
                'description' => 'Elephants in Space',
                'series' => [
                  {
                    'dataSource' => {
                      'datasetUid' => 'elep-hant',
                      'dimension' => {
                        'columnName' => 'dreamers'
                      },
                      'domain' => 'vertex-stories.test-socrata.com',
                      'type' => 'socrata.soql',
                      'filters' => [
                        {
                          'function': 'noop',
                          'columnName': 'id_nls'
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        }
        metadata = DisplayFormat.new(data).visualization_canvas_metadata

        expect(metadata[:vifs][0][:series][0][:dataSource][:filters][0].key?(:arguments)).to eq(true)
        expect(metadata[:vifs][0][:series][0][:dataSource][:filters][0][:arguments]).to be_nil
      end

      it 'restores the arguments property for noop filters in filters' do
        data = {
          'visualizationCanvasMetadata' => {
            'filters' => [
              {
                'function': 'noop',
                'columnName': 'id_nls'
              }
            ]
          }
        }
        metadata = DisplayFormat.new(data).visualization_canvas_metadata

        expect(metadata[:filters][0].key?(:arguments)).to eq(true)
        expect(metadata[:filters][0][:arguments]).to be_nil
      end
    end
  end
end
