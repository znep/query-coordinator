require 'rails_helper'
require 'featured_content'

describe FeaturedContent do

  include TestHelperMethods

  before do
    init_current_domain
  end

  subject { FeaturedContent }

  let(:clp_parent_uid) { 'category%3DGovernment' }
  let(:clp_parent_type) { 'catalog_query' }
  let(:dslp_parent_uid) { '1234-abcd' }
  let(:dslp_parent_type) { 'view' }

  let(:view) do
    View.new(
      'id' => 'data-lens',
      'newBackend' => true,
      'description' => 'Glasses for your data!',
      'name' => 'Data Lens',
      'displayType' => 'data_lens',
      'createdAt' => Time.at(12345678).to_i,
      'updatedAt' => Time.at(12345678).to_i,
      'is_public' => false,
      'viewCount' => 0
    )
  end

  let(:formatted_view) do
    {
      :name => 'Data Lens',
      :id => 'data-lens',
      :description => 'Glasses for your data!',
      :url => 'https://localhost/dataset/Data-Lens/data-lens',
      :displayType => 'data_lens',
      :createdAt => Time.at(12345678),
      :updatedAt => Time.at(12345678),
      :viewCount => 0,
      :isPrivate => true
    }.with_indifferent_access
  end

  let(:new_external_view_featured_item) do
    {
      'parentUid' => dslp_parent_uid,
      'parentType' => dslp_parent_type,
      'contentType' => 'external',
      'description' => 'I am a banana!',
      'previewImageBase64' => 'iVBORw0KGgoAAAA=',
      'position': 1,
      'url' => 'https://food.for.thought.org'
    }
  end

  let(:new_external_featured_item) do
    {
      'parentUid' => clp_parent_uid,
      'parentType' => clp_parent_type,
      'contentType' => 'external',
      'description' => 'I am a banana!',
      'previewImageBase64' => 'iVBORw0KGgoAAAA=',
      'position': 1,
      'url' => 'https://food.for.thought.org'
    }
  end

  context 'featured_content' do

    context 'when parent_type is "view"' do
      it 'should make a create request with the new_external_view_featured_item' do
        json = new_external_view_featured_item.to_json
        expect(CoreServer::Base.connection).to receive(:create_request).with('/featured_content', json).
          and_return(json)
        result = subject.create_or_update(dslp_parent_uid, dslp_parent_type, new_external_view_featured_item)
      end
    end

    context 'when parent_type is "catalog_query"' do
      let(:existing_internal_featured_content) do
        {
          'id' => 1,
          'contentType' => 'internal',
          'description' => '',
          'featuredfeaturedLensUid' => 'vkji-3zrf',
          'parentType' => 'catalog_query',
          'position' => 0,
          'title' => 'Healthcare Facility Locations',
          'url' => 'https://localhost/Government/Healthcare-Facility-Locations/vkji-3zrf'
        }
      end

      let(:existing_external_featured_content) do
        {
          'id' => 2,
          'contentType' => 'external',
          'description' => 'THIS IS SPARTA!!!',
          'parentType' => 'catalog_query',
          'position' => 1,
          'previewImage' => 'c3ea70bc-4068-43a7-ad1f-8d8102d3d35a',
          'title' => 'This is sparta!',
          'url' => 'http://www.sparta.com'
        }
      end

      let(:featured_content) do
        File.read("#{Rails.root}/spec/fixtures/vcr_cassettes/clp/featured_content.json")
      end

      it 'should have some featured_content' do
        VCR.use_cassette('existing_featured_content') do
          featured_content = subject.fetch(clp_parent_uid, clp_parent_type)

          expect(featured_content.length).to eq(3)

          expect(featured_content[0]['contentType']).to eq('external')
          expect(featured_content[0]['imageUrl']).to eq('https://localhost/api/file_data/c6d60ec7-0961-4629-b86a-fb96925d1ccc')

          expect(featured_content[1]['contentType']).to eq('internal')
          expect(featured_content[1]['uid']).to eq('rp4e-cauq')
        end
      end

      it 'should make a create request with the new_external_featured_item' do
        json = new_external_featured_item.to_json
        expect(CoreServer::Base.connection).to receive(:create_request).with('/featured_content', json).
          and_return(json)
        subject.create_or_update(clp_parent_uid, clp_parent_type, new_external_featured_item)
      end

      it 'should make a delete request with the existing_featured_item' do
        expect(CoreServer::Base.connection).to receive(:delete_request).with(
          "/featured_content/#{existing_internal_featured_content['id']}"
        ).and_return(existing_internal_featured_content)
        subject.destroy(existing_internal_featured_content['id'])
      end

    end

  end

  context 'reformatting the data' do
    let(:dslp_featured_item) do
      {
        :id => 3,
        :position => 2,
        :contentType => 'internal', # Or 'external' -- this is not a MIME type
        :name => 'featured',
        :parentType => 'data_lens',
        :featuredView => view
      }.with_indifferent_access
    end

    let(:featured_item) do
      {
        :position =>  0,
        :contentType => 'internal',
        :name => 'Catalog Landing Page Internal Featured Content Item',
        :parentType => 'catalog_query'
      }.with_indifferent_access
    end

    it 'formats the featured item' do
      formatted_result = FeaturedContent.send(:formatted_featured_item, dslp_featured_item)

      expect(formatted_result['featuredView']).to eq(formatted_view)
    end

    it 'formats the view widget' do
      formatted_result = subject.send(:format_view_widget, view)
      expect(formatted_result).to eq(formatted_view)
    end

    it 'does not try to format the view of an internal catalog landing page item' do
      expect(FeaturedContent).to receive(:format_view_widget).never

      FeaturedContent.send(:formatted_featured_item, featured_item)
    end
  end

end
