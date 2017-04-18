require 'rails_helper'

describe CatalogFederatorConnector do
  include TestHelperMethods

  before(:all) { VCR.turn_off! }
  after(:all) { VCR.turn_on! }

  let(:fixture_prefix) { "#{Rails.root}/spec/fixtures/data_connector" }
  let(:base_uri) { 'http://cf-host:80' }

  describe '#get_sources' do
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

    it 'returns the domains souces if catalog-federator returns them' do
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
end
