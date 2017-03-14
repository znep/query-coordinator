require 'rails_helper'
require 'featured_content'

describe FeaturedContent do

  include TestHelperMethods

  before do
    init_current_domain
  end

  subject { FeaturedContent }

  let(:id) { 'fun' }
  let(:parent_type) { 'catalog_query' }

  let(:featured_item) do
    {
      :position => 2,
      :contentType => 'internal', # Or 'external' -- this is not a MIME type
      :name => 'featured',
      :parentType => 'data_lens',
      :featuredView => view
    }.with_indifferent_access
  end

  let(:clp_featured_item) do
    {
      :position =>  0,
      :contentType => 'internal',
      :name => 'Catalog Landing Page Internal Featured Content Item',
      :parentType => 'catalog_query'
    }.with_indifferent_access
  end

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

  context 'featured_content' do

    context 'when parent_type is "catalog_query"' do
      let(:new_featured_item) do
        {
          'contentType' => 'external',
          'description' => 'I am a banana!',
          'previewImageBase64' => '12345678-1234-1234-1234-123456789012',
          'position': position,
          'url' => 'https://food.for.thought.org'
        }
      end

      let(:existing_featured_item) do
        {
          'id': id
        }.to_json
      end

      let(:position) { 0 }

      let(:featured_content) do
        File.read("#{Rails.root}/spec/fixtures/vcr_cassettes/clp/featured_content.json")
      end

      it 'should have some featured_content' do
        stub_request(:get, "http://localhost:8080/featured_content/#{id}?parentType=#{parent_type}").
          with(:headers => request_headers).to_return(:status => 200, :body => featured_content, :headers => {})

        featured_content = subject.fetch(id, parent_type)

        expect(featured_content.length).to eq(3)

        expect(featured_content[2]['contentType']).to eq('external')
        expect(featured_content[2]['previewImage']).to eq('f2234ba4-2518-4537-b295-1ba815b83457')

        expect(featured_content[1]['contentType']).to eq('internal')
        expect(featured_content[1]['lensUid']).to eq('2jnm-ghyx')
      end

      it 'should make a create request with the new_featured_item' do
        expect(CoreServer::Base.connection).to receive(:create_request).with(
          '/featured_content',
          new_featured_item.to_json
        ).and_return(new_featured_item.to_json)
        subject.create_or_update(id, parent_type, new_featured_item)
      end

      it 'should make a delete request with the existing_featured_item' do
        expect(CoreServer::Base.connection).to receive(:delete_request).with(
          "/featured_content/#{id}?parentType=#{parent_type}&position=#{position}"
        ).and_return(existing_featured_item)
        subject.destroy(id, parent_type, position)
      end

    end

  end

  context 'reformatting the data' do
    it 'formats the featured item' do
      formatted_result = FeaturedContent.send(:formatted_featured_item, featured_item)

      expect(formatted_result['featuredView']).to eq(formatted_view)
    end

    it 'formats the view widget' do
      formatted_result = subject.send(:format_view_widget, view)
      expect(formatted_result).to eq(formatted_view)
    end

    it 'does not try to format the view of an internal catalog landing page item' do
      expect(FeaturedContent).to receive(:format_view_widget).never

      FeaturedContent.send(:formatted_featured_item, clp_featured_item)
    end
  end

end
