require 'rails_helper'

describe CatalogFederatorConnector do
  include TestHelperMethods

  before(:all) { VCR.turn_off! }
  after(:all) { VCR.turn_on! }

  let(:fixture_prefix) { "#{Rails.root}/spec/fixtures/data_connector" }
  let(:base_uri) { 'http://cf-host:80' }

  describe '#servers' do
    before do
      allow(CurrentDomain).to receive(:cname).and_return('localhost')
      allow(APP_CONFIG).to receive(:catalog_federator_url).and_return('cf-host')
      allow_any_instance_of(Socrata::CookieHelper).to receive(:current_cookies).and_return('nom_NOM')

      stub_request(:get, "#{base_uri}/v1/source").
        with(:headers => {'Content-Type' => 'application/json', 'X-Socrata-RequestId' => 'req_id1', 'Cookie' => 'nom_NOM', 'X-Socrata-Host' => 'localhost'}).
        to_return(body: File.read("#{fixture_prefix}/cf_sources.json"), headers: {'Content-Type' => 'application/json'})
      stub_request(:get, "#{base_uri}/v1/source").
        with(:headers => {'Content-Type' => 'application/json', 'X-Socrata-RequestId' => 'req_id2', 'Cookie' => 'nom_NOM', 'X-Socrata-Host' => 'localhost'}).
        to_return(status: 500)
    end

    it 'returns the domains sources if catalog-federator returns them' do
      allow_any_instance_of(Socrata::RequestIdHelper).to receive(:current_request_id).and_return('req_id1')
      sources = CatalogFederatorConnector.servers
      expect(sources).to be_kind_of(Array)
      expect(sources.length).to be(3)

      sources.each do |s|
        expect(s).to be_kind_of(CatalogFederatorSource)
      end
    end

    it 'returns an empty array if catalog-federator cannot return them' do
      allow_any_instance_of(Socrata::RequestIdHelper).to receive(:current_request_id).and_return('req_id2')
      sources = CatalogFederatorConnector.servers
      expect(sources).to be_kind_of(Array)
      expect(sources.length).to be(0)
    end
  end

  describe '#create' do
    before do
      allow(CurrentDomain).to receive(:cname).and_return('localhost')
      allow(APP_CONFIG).to receive(:catalog_federator_url).and_return('cf-host')
      allow_any_instance_of(Socrata::CookieHelper).to receive(:current_cookies).and_return('nom_NOM')

      stub_request(:post, "#{base_uri}/v1/source").
        with(:headers => {'Content-Type' => 'application/json', 'X-Socrata-RequestId' => 'req_id1', 'Cookie' => 'nom_NOM', 'X-Socrata-Host' => 'localhost'}).
        to_return(body: File.read("#{fixture_prefix}/cf_created_source.json"), headers: {'Content-Type' => 'application/json'})
      stub_request(:post, "#{base_uri}/v1/source").
        with(:headers => {'Content-Type' => 'application/json', 'X-Socrata-RequestId' => 'req_id2', 'Cookie' => 'nom_NOM', 'X-Socrata-Host' => 'localhost'}).
        to_return(status: 500)
    end

    it 'returns the created source if catalog-federator successfully creates it' do
      allow_any_instance_of(Socrata::RequestIdHelper).to receive(:current_request_id).and_return('req_id1')
      source_form = {'source_url' => 'some.data.json', 'display_name' => 'data'}
      source = CatalogFederatorConnector.create(source_form)
      expect(source).to be_kind_of(Hash)
      expect(source['id']).to be(4129)
      expect(source['state']).to eq('active')
      expect(source['source']).to eq('http://gisdata.hartford.gov/data.json')
      expect(source['displayName']).to eq('Hartford GIS')
      expect(source['targetDomainId']).to be(76)
      expect(source['syncSelectionPolicy']).to eq('all')
      expect(source['syncUserId']).to be(689)
    end

    it 'returns an empty array if catalog-federator cannot return them' do
      allow_any_instance_of(Socrata::RequestIdHelper).to receive(:current_request_id).and_return('req_id2')
      source_form = {'source_url' => 'some.data.json', 'display_name' => 'data'}
      expect do
        CatalogFederatorConnector.create(source_form)
      end.to raise_error(StandardError)
    end
  end
end
