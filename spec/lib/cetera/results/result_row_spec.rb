require 'rails_helper'

describe Cetera::Results do
  include TestHelperMethods

  describe 'Row' do
    let(:sample_result_row) do
      hash = JSON.parse(File.read("#{Rails.root}/test/fixtures/cetera_row_results.json"))
      Cetera::Results::ResultRow.new(hash)
    end

    it 'should test_cetera_result_row_delegators' do
      expect(sample_result_row.id).to eq('r8ea-mq83')
      expect(sample_result_row.link).to eq('https://data.cityofchicago.org/d/r8ea-mq83')
      expect(sample_result_row.name).to eq('Performance Metrics - Innovation & Technology - Site Availability')
      expect(sample_result_row.description).to match(/availability metrics/)
      expect(sample_result_row.type).to eq('dataset')
      expect(sample_result_row.categories).to eq(['Administration & Finance'])
      expect(sample_result_row.tags).to eq(['administration', 'finance'])
    end

    it 'should test_cetera_result_row_other_methods' do
      expect(sample_result_row.default_page).to eq('1234-abcd')
      expect(sample_result_row.display_class).to eq('Blist')
      expect(sample_result_row.display_title).to eq('Table')
      expect(sample_result_row.domainCName).to eq('data.cityofchicago.org')
      expect(sample_result_row.federated?).to eq(true)
      expect(sample_result_row.icon_class).to eq('icon')
      expect(sample_result_row.story?).to eq(false)
    end

    it 'should support expected display types or fallback to base' do
      type_expected = {
        'api' => Cetera::Displays::Api,
        'calendar' => Cetera::Displays::Calendar,
        'chart' => Cetera::Displays::Chart,
        'datalens' => Cetera::Displays::DataLens,
        'dataset' => Cetera::Displays::Dataset,
        'draft' => Cetera::Displays::Draft,
        'file' => Cetera::Displays::File,
        'filter' => Cetera::Displays::Filter,
        'form' => Cetera::Displays::Form,
        'link' => Cetera::Displays::Link,
        'map' => Cetera::Displays::Map,
        'pulse' => Cetera::Displays::Pulse,
        'story' => Cetera::Displays::Story,

        'href' => Cetera::Displays::Link, # deprecated

        'missing' => Cetera::Displays::Base,
        :pants => Cetera::Displays::Base,
        [] => Cetera::Displays::Base,
        nil => Cetera::Displays::Base
      }

      type_expected.each do |type, expected|
        mini_response = {
          'resource' => { 'type' => type },
          'metadata' => { 'domain' => 'pants.com' },
          'classification' => {
            'domain_category' => 'pants',
            'domain_tags' => %w(tubes, legs)
          }
        }
        actual = Cetera::Results::ResultRow.new(mini_response)
        expect(actual.display).to eq(expected)
      end
    end

    describe 'get_preview_image_url' do
      it 'returns the url for stories' do
        expect(sample_result_row).to receive(:story?).and_return(true)
        expect(Storyteller).to receive(:get_tile_image).and_return('neat-picture')

        expect(sample_result_row.get_preview_image_url('cookies', 'request_id')).to eq('neat-picture')
      end

      it 'returns the url when previewImageId is present on the view' do
        view_data = { 'previewImageId' => 'awesome-image-id' }
        expected_url = "/api/views/#{sample_result_row.id}/files/awesome-image-id"
        expect(View).to receive(:find).and_return(View.new(view_data))

        expect(sample_result_row.get_preview_image_url('cookies', 'request_id')).to eq(expected_url)
      end

      it 'returns nil if the previewImageId is not present' do
        expect(View).to receive(:find).and_return(View.new)

        expect(sample_result_row.get_preview_image_url('cookies', 'request_id')).to be_nil
      end

      it 'returns nil if the Core query throws ResourceNotFound' do
        expect(View).to receive(:find).and_raise(CoreServer::ResourceNotFound.new(nil))
        expect(sample_result_row.get_preview_image_url('cookies', 'request_id')).to be_nil
      end

      it 'returns nil if the Core query throws CoreServerError' do
        expect(View).to receive(:find).and_raise(CoreServer::CoreServerError.new(nil, nil, nil))
        expect(sample_result_row.get_preview_image_url('cookies', 'request_id')).to be_nil
      end
    end
  end
end
