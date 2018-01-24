require 'rails_helper'

describe Cetera::Utils do
  include TestHelperMethods

  it 'should handle cetera soql params as query' do
    actual_params = Cetera::Utils.cetera_soql_params(sample_search_options)
    compare_params(actual_params)
  end

  it 'should handle sort order correctly' do
    url_params = sample_search_options.merge(:default_sort => nil, :sortBy => 'alpha')
    actual_params = Cetera::Utils.cetera_soql_params(url_params)
    expected_params = expected_cetera_params.merge(:order => 'name')
    compare_params(actual_params, expected_params)

    url_params = sample_search_options.merge(:default_sort => 'newest', :sortBy => nil)
    actual_params = Cetera::Utils.cetera_soql_params(url_params)
    expected_params = expected_cetera_params.merge(:order => 'createdAt')
    compare_params(actual_params, expected_params)
  end

  context 'translating offsets' do
    it 'should return the provided offset when available' do
      expect(Cetera::Utils.translate_offset(30, 9999, 4)).to eq(30)
    end

    it 'should calculate the offset from page and limit when provided' do
      expect(Cetera::Utils.translate_offset(nil, 5, 2)).to eq(8)
    end

    it 'should return 0 when offset, page, and limit are nil' do
      expect(Cetera::Utils.translate_offset(nil, nil, nil)).to eq(0)
    end
  end

  it 'should test_cetera_limit_type_translator' do
    frontend_to_cetera = {
      'data_lens' => 'datalenses',
      'story' => 'stories',
      'pulse' => 'pulses',
      'tables' => 'datasets',
      'charts' => 'charts',
      'maps' => 'maps',
      'calendars' => 'calendars',
      'filters' => 'filters',
      'href' => 'links',
      'blob' => 'files',
      'forms' => 'forms'
    }

    frontend_to_cetera.each do |frontend_type, cetera_type|
      expect(Cetera::Utils.translate_display_type(frontend_type, 'dataset')).to eq(cetera_type)
    end

    expect(Cetera::Utils.translate_display_type('tables', 'view')).to eq('filters')
  end

  it 'should test_cetera_sort_order_translator' do
    frontend_to_cetera = {
      nil => 'relevance',
      'relevance' => 'relevance',
      'most_accessed' => 'page_views_total',
      'alpha' => 'name',
      'newest' => 'createdAt',
      'oldest' => 'createdAt ASC',
      'last_modified' => 'updatedAt'
    }

    frontend_to_cetera.each do |frontend_type, cetera_type|
      expect(Cetera::Utils.translate_sort_by(frontend_type)).to eq(cetera_type)
    end

    ['bogus', 'sort by', 'orders'].each do |bogus|
      expect { Cetera::Utils.translate_sort_by(bogus) }.to raise_error(KeyError)
    end
  end

  describe 'search_views' do
    before(:all) { VCR.turn_off! }
    after(:all) { VCR.turn_on! }

    path = APP_CONFIG.cetera_internal_uri + '/catalog/v1'
    viz_params = {
      :public => true,
      :published => true,
      :approval_status => 'approved',
      :explicitly_hidden => false
    }

    it 'should test_cetera_search_views_raises_timeout_error_on_timeout' do
      domain = 'data.redmond.gov'
      init_current_domain
      allow(CurrentDomain).to receive(:cname).and_return(domain)

      stub_request(:get, APP_CONFIG.cetera_internal_uri + '/catalog/v1').
        with(headers: { 'X-Socrata-RequestId' => 'uh-oh-timeout'},
             query: Cetera::Utils.cetera_soql_params(:search_context => domain).merge(viz_params)).
        to_timeout

      expect { Cetera::Utils.search_views('uh-oh-timeout') }.to raise_error(Timeout::Error)
    end

    it 'should test_request_id_gets_passed_along_to_cetera' do
      domain = 'example.com'
      allow(CurrentDomain).to receive(:cname).and_return(domain)
      query = { domains: [domain], search_context: domain}
      request_id = 'iAmProbablyUnique'

      stub_request(:get, path).
        with(headers: { 'X-Socrata-RequestId' => request_id, 'Content-Type' => 'application/json' },
             query: Cetera::Utils.cetera_soql_params(query).merge(viz_params)).
        to_return(status: 200, body: {}.to_json, headers: { 'Content-Type' => 'application/json' } )

      Cetera::Utils.search_views(request_id, nil, query)
      expect(WebMock).to have_requested(:get, path).
        with(query: Cetera::Utils.cetera_soql_params(query).merge(viz_params),
             headers: { 'X-Socrata-RequestId' => request_id, 'Content-Type' => 'application/json' } )
    end

    it 'should test_for_user_param_gets_passed_along_to_cetera' do
      domain = 'data.redmond.gov'
      init_current_domain
      allow(CurrentDomain).to receive(:cname).and_return(domain)
      query = {
        domains: [domain],
        search_context: domain,
        for_user: '7kqh-9s5a'
      }

      params = Cetera::Utils.cetera_soql_params(query).merge(viz_params)
      expect(params).to include(:for_user)

      stub_request(:get, path).
        with(query: params).
        to_return(status: 200, body: {}.to_json, headers: { 'Content-Type' => 'application/json' })

      Cetera::Utils.search_views(nil, nil, query)

      expect(WebMock).to have_requested(:get, path).with(query: params)
    end
  end

  describe 'get_derived_from_views' do
    let(:request_id) { 'iAmProbablyUnique' }
    let(:cookie) { '_cookie=nomNom' }

    let(:cetera_results) do
      cetera_payload = json_fixture('cetera_search_results.json')
      Cetera::Results::CatalogSearchResult.new(cetera_payload)
    end

    before(:each) do
      allow(CurrentDomain).to receive(:cname).and_return('unicorns')
    end

    it 'returns CeteraResultRow objects' do
      allow(Cetera::Utils).to receive(:search_views).and_return(cetera_results)
      result = Cetera::Utils.get_derived_from_views('data-lens', request_id, cookie)

      expect(result.first.class).to eq(Cetera::Results::ResultRow)
    end

    it 'invokes Cetera with limit and offset parameters' do
      expect(Cetera::Utils).to receive(:search_views).
        with(
          request_id,
          cookie,
          {
            domains: ['unicorns'],
            derived_from: 'data-lens',
            offset: 20,
            limit: 30
          }
        ).
        and_return(cetera_results)

      options = { offset: 20, limit: 30 }
      Cetera::Utils.get_derived_from_views('data-lens', request_id, cookie, options)
    end

    it 'invokes Cetera with boost parameters' do
      expect(Cetera::Utils).to receive(:search_views).
        with(
          request_id,
          cookie,
          {
            domains: ['unicorns'],
            derived_from: 'data-lens',
            boostCalendars: 100.0
          }
        ).
        and_return(cetera_results)

      options = { boostCalendars: 100.0 }
      Cetera::Utils.get_derived_from_views('data-lens', request_id, cookie, options)
    end

    it 'returns an empty array when Cetera returns a bad response' do
      allow(Cetera::Utils).to receive(:search_views).and_return(nil)
      options = { offset: nil, limit: 'purple' }
      result = Cetera::Utils.get_derived_from_views('data-lens', request_id, cookie, options)

      expect(result).to be_a Array
      expect(result.length).to eq(0)
    end
  end

  describe 'get_tags' do
    let(:request_id) { 'iAmProbablyUnique' }
    let(:cookie) { '_cookie=nomNom' }

    it 'returns a TagCountResult with expected properties' do
      VCR.use_cassette('cetera/get_tags') do
        allow(CurrentDomain).to receive(:cname).and_return('localhost')

        results = Cetera::Utils.get_tags(request_id, cookie)

        expect(results.class).to eq(Cetera::Results::TagCountResult)
        expect(results.results[0].name).to eq('biz')
        expect(results.results[0].domain_tag).to eq('biz')
        expect(results.results[0].frequency).to eq(1)
        expect(results.results[0].count).to eq(1)
      end
    end

    it 'returns empty result set when Cetera returns a bad response' do
      VCR.use_cassette('cetera/failed_get_tags') do
        allow(CurrentDomain).to receive(:cname).and_return('opendata.rc-socrata.com')

        # fails because opendata.rc-socrata.com is not indexed on localhost
        results = Cetera::Utils.get_tags(request_id, cookie)

        expect(results.results).to eq([])
      end
    end
  end

  # add searches for shared_to for these last 2 examples as well

  private

  def sample_search_options
    {
      domains: ['data.cityofchicago.org', 'data.example.com', 'datacatalog.cookcountyil.gov'],
      domain_boosts: { 'data.example.com' => 0.808, 'datacatalog.cookcountyil.gov' => 0.909 },
      limitTo: 'tables',
      q: 'giraffes are whack!&@*!',
      locale: 'pirate',
      limit: 10,
      page: 4,
      categories: ['Traffic, Parking, and Transportation', 'And another thing'],
      metadata_tag: { 'Dataset-Information_Superhero' => 'Superman' },
    }
  end

  # CGI.escape happens in search_views params.to_query
  def expected_cetera_params
    {
      domains: 'data.cityofchicago.org,data.example.com,datacatalog.cookcountyil.gov',
      # search_context (CurrentDomain.cname) changes with test context so is not tested
      boostDomains: { 'data.example.com' => 0.808, 'datacatalog.cookcountyil.gov' => 0.909 },
      only: 'datasets',
      q: 'giraffes are whack!&@*!',
      locale: 'pirate',
      limit: 10,
      offset: 30,
      categories: ['Traffic, Parking, and Transportation', 'And another thing'],
      'Dataset-Information_Superhero' => 'Superman',
    }
  end

  def compare_params(actual_params, expected_params=expected_cetera_params)
    expected_params.each do |key, expected|
      actual = actual_params[key]
      expect(actual).to eq(expected)
    end
  end
end
