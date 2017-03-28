require 'rails_helper'
require 'catalog_landing_page'

describe CatalogLandingPage do

  include TestHelperMethods

  before do
    init_current_domain
    allow(CurrentDomain).to receive(:custom_facets).and_return(custom_facets)
    RequestStore.clear!
  end

  subject { CatalogLandingPage.new(cname, params) }

  let(:cname) { 'localhost' }
  let(:params) { { category: 'Government' }.with_indifferent_access }
  let(:id) { 'category%3DGovernment' }
  let(:custom_facets) { [] }

  context 'after initialization' do
    it 'has the expected cname set' do
      expect(subject.cname).to eq(cname)
    end

    it 'has the expected id set' do
      expect(subject.id).to eq(id)
    end
  end

  describe '.valid_params' do
    let(:custom_facets) { %w(custom facet list) }

    it 'includes custom facets correctly' do
      valid_params = CatalogLandingPage.valid_params
      expect(valid_params).to include(*custom_facets)
      expect(valid_params).to include(*CatalogLandingPage::PARAMS_WHITELIST)
    end
  end

  describe '.may_activate?' do
    let(:request) do
      double(:request, params: ActionController::Parameters.new(params),
             query_parameters: params)
    end
    let(:max_param_overlap) { 1 }
    before(:each) do
      init_feature_flag_signaller(with: {
        catalog_landing_page_allows_multiple_params: max_param_overlap
      })
    end

    context 'when it is just /browse' do
      let(:params) { { custom_path: 'browse' } }

      it 'should return true' do
        expect(CatalogLandingPage.may_activate?(request)).to eq(true)
      end
    end

    context 'when we get a parameter' do
      let(:params) { { category: 'Whatever' } }

      it 'should return true' do
        expect(CatalogLandingPage.may_activate?(request)).to eq(true)
      end
    end

    context 'when we get too many parameters' do
      let(:params) { { category: 'Whatever', limitTo: 'charts' } }

      it 'should return true' do
        expect(CatalogLandingPage.may_activate?(request)).to eq(false)
      end
    end

    context 'when we get multiple parameters but overlap is allowed' do
      let(:params) { { category: 'Whatever', limitTo: 'charts' } }
      let(:max_param_overlap) { 2 }

      it 'should return true' do
        expect(CatalogLandingPage.may_activate?(request)).to eq(true)
      end
    end
  end

  describe '.exists?' do
    before(:each) do
      allow(CurrentDomain).to receive(:configuration).
        with(:catalog_landing_page).and_return(configuration)
    end
    let(:configuration) { double(:config, properties: properties) }
    let(:properties) { {} }
    let(:params) { {} }
    let(:request) do
      double(:request, params: ActionController::Parameters.new(params),
             query_parameters: params)
    end

    context 'when the configuration does not exist' do
      let(:configuration) { nil }

      it 'should return false' do
        expect(CatalogLandingPage.exists?(request)).to eq(false)
      end
    end

    context 'when the configuration has no properties' do
      it 'should return false' do
        expect(CatalogLandingPage.exists?(request)).to eq(false)
      end
    end

    context 'when the configuration has a custom path' do
      let(:properties) { { '/something-completely-weird' => {} } }

      context 'and it is being requested' do
        let(:params) { { custom_path: 'something-completely-weird' } }

        it 'should return true' do
          expect(CatalogLandingPage.exists?(request)).to eq(true)
        end
      end

      context 'and it is not being requested' do
        let(:params) { { custom_path: 'something-not-weird' } }

        it 'should return false' do
          expect(CatalogLandingPage.exists?(request)).to eq(false)
        end
      end
    end

    context 'when the configuration has a param-based key' do
      let(:properties) { { 'category%3DGovernment' => {} } }

      context 'and it is being requested' do
        let(:params) { { category: 'Government' } }

        it 'should return true' do
          expect(CatalogLandingPage.exists?(request)).to eq(true)
        end
      end

      context 'and it is not being requested' do
        let(:params) { { category: 'something else' } }

        it 'should return false' do
          expect(CatalogLandingPage.exists?(request)).to eq(false)
        end
      end
    end

    context 'when the configuration has a param-based key that is a custom facet' do
      let(:custom_facets) { %w(custom facet) }
      let(:properties) { { 'custom%3DWaaagh' => {} } }

      context 'and it is being requested' do
        let(:params) { { custom: 'Waaagh' } }

        it 'should return true' do
          expect(CatalogLandingPage.exists?(request)).to eq(true)
        end
      end

      context 'and it is not being requested' do
        let(:params) { { custom: 'sadness' } }

        it 'should return false' do
          expect(CatalogLandingPage.exists?(request)).to eq(false)
        end
      end
    end
  end

  describe '.catalog_query' do
    it 'should return a canonical key given valid input' do
      some_hash = ActionController::Parameters.new(category: 'Foo')
      result_id = 'category%3DFoo'
      expect(CatalogLandingPage.catalog_query(some_hash)).to eq(result_id)
    end

    it 'should handle array values' do
      some_hash = ActionController::Parameters.new(tags: %w(one two three))
      result_id = 'tags%5B%5D%3Done%26tags%5B%5D%3Dthree%26tags%5B%5D%3Dtwo'
      expect(CatalogLandingPage.catalog_query(some_hash)).to eq(result_id)
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
        counts = subject.category_stats('Government', 'req_id', '_cookie=nomNom')
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
