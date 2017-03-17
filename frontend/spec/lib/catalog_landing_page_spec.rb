require 'rails_helper'
require 'catalog_landing_page'

describe CatalogLandingPage do

  include TestHelperMethods

  before do
    init_current_domain
  end

  subject { CatalogLandingPage.new(cname, id) }

  let(:cname) { 'localhost' }
  let(:id) { CGI.escape!('category=Government') }

  context 'after initialization' do

    it 'has the expected cname set' do
      expect(subject.cname).to eq(cname)
    end

    it 'has the expected id set' do
      expect(subject.id).to eq(id)
    end

  end

  context 'metadata' do

    it 'fetches the existing metadata' do
      stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=catalog_landing_page').
        with(:headers => request_headers).to_return(:status => 200, :body => mock_configuration, :headers => {})

      expect(subject.metadata['headline']).to eq('I am the headline')
      expect(subject.metadata['description']).to eq('I am the description')
      expect(subject.metadata['summary']).to eq('This is all she wrote!')
    end

    context 'setting metadata' do

      it 'adds new metadata' do
        stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=catalog_landing_page').
          with(:headers => request_headers).
          to_return(:status => 200, :body => mock_configuration, :headers => {})
        stub_request(:put, "http://localhost:8080/configurations/65/properties/#{id}.json").
          with(:headers => request_headers).
          to_return(:status => 200, :body => mock_new_metadata.to_json, :headers => {})

        metadata = subject.update_metadata(mock_new_metadata)

        expect(metadata['headline']).to eq('Who took my lulz?')
        expect(metadata['description']).to eq('ZOMFG This is SO NEW!')
        expect(metadata['summary']).to eq('Just looking...')
      end

      it 'updates existing metadata' do
        stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=catalog_landing_page').
          with(:headers => request_headers).
          to_return(:status => 200, :body => mock_configuration, :headers => {})
        stub_request(:put, "http://localhost:8080/configurations/65/properties/#{id}.json").
          with(:headers => request_headers).
          to_return(:status => 200, :body => mock_updated_metadata.to_json, :headers => {})

        metadata = subject.update_metadata(mock_new_metadata)

        expect(metadata['headline']).to eq('I am NOT a banana!')
        expect(metadata['description']).to eq('I am NOT a clone of Cavendish.')
        expect(metadata['summary']).to eq('I AM a sweet plaintain.')
      end

      it 'complains about missing keys' do
        expect { subject.update_metadata('lol', {}) }.to raise_error(ArgumentError)
      end

    end

  end

  context '#update_featured_content' do

    it 'updates new or existing featured content' do
      expect(subject).to receive(:create_or_update_featured_content).once
      subject.update_featured_content(:removed => false)
    end

    it 'deletes existing featured content' do
      expect(subject).to receive(:delete_featured_content).once
      subject.update_featured_content(:removed => true, :resource_id => 123)
    end

    it 'does not try to delete ephemeral deleted featured content' do
      expect(subject).to receive(:delete_featured_content).never
      subject.update_featured_content(:removed => true)
    end

  end

  context 'category stats' do

    it 'returns the counts for the given category' do
      VCR.use_cassette('catalog_landing_page_category_counts') do
        counts = subject.category_stats('Government', 'req_id')
        expect(counts['datasets']).to eq(8)
      end
    end

  end

  private

  def mock_configuration
    @mock_configuration ||= File.read("#{Rails.root}/spec/fixtures/vcr_cassettes/clp/configuration.json")
  end

  def mock_new_metadata
    @mock_new_metadata ||= JSON.parse(File.read("#{Rails.root}/spec/fixtures/vcr_cassettes/clp/new_metadata.json"))
  end

  def mock_updated_metadata
    @mock_updated_metadata ||= JSON.parse(File.read("#{Rails.root}/spec/fixtures/vcr_cassettes/clp/updated_metadata.json"))
  end

end
