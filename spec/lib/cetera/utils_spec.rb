require 'rails_helper'

describe Cetera::Utils do
  include TestHelperMethods

  it 'should handle cetera soql params as query' do
    params = Cetera::Utils.cetera_soql_params(sample_search_options)

    expected_cetera_params.each do |key, expected|
      actual = params[key]
      expect(actual).to eq(expected)
    end
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
      'forms' => 'forms',
      'apis' => 'apis'
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
    it 'should test_cetera_search_views_raises_timeout_error_on_timeout' do
      query = { domains: ['example.com'] }
      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: Cetera::Utils.cetera_soql_params(query)).
        to_timeout

      expect { Cetera::Utils.search_views(query, nil, 'Unvailable') }.to raise_error(Timeout::Error)
    end

    it 'should test_cookies_and_request_id_get_passed_along_to_cetera' do
      query = { domains: ['example.com'] }
      cookies = {
        'i am a cookie' => 'of oatmeal and raisins',
        'i am also a cookie' => 'of chocolate chips'
      }.map { |key, value| "#{key}=#{value}" }.join('; ')

      request_id = 'iAmProbablyUnique'

      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(headers: { 'Cookie' => cookies, 'X-Socrata-RequestId' => request_id },
             query: Cetera::Utils.cetera_soql_params(query)).
        to_return(status: 500, body: 'I cannot be parsed!')

      # Unsuccessful response returns false, just sayin'
      expect(Cetera::Utils.search_views(query, cookies, request_id)).to eq(false)
    end

    it 'should test_for_user_param_gets_passed_along_to_cetera' do
      domain = 'data.redmond.gov'
      init_current_domain
      allow(CurrentDomain).to receive(:cname).and_return(domain)
      query = {
        domains: [domain],
        for_user: '7kqh-9s5a'
      }

      cetera_soql_params = Cetera::Utils.cetera_soql_params(query)
      expect(cetera_soql_params).to include(:for_user)

      response = {
        'results' => [],
        'resultSetSize' => 0,
        'timings' => { 'serviceMillis' => 118, 'searchMillis' => [2, 2] }
      }

      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: cetera_soql_params).
        to_return(status: 200, body: response.to_json)

      res = Cetera::Utils.search_views(query, nil, 'funnyId')

      expect(res.data.to_hash).to eq(response)
      expect(res.results).to be_empty
    end
  end

  describe 'Cetera user search' do
    search_query = 'katie'

    # NOTE: If you re-record the cassette, you'll need to replace this with whatever is getting
    # passed to Cetera & Core. Check the Cetera debug logs or puts forwardable_session_cookies.
    cookie_string = 'logged_in=true; _socrata_session_id=BAh7CkkiD3Nlc3Npb25faWQGOgZFRkkiJTk2YzU2Zjk0YTdjM2RhMWMzODQ4M2E4OGE0MzNhNDkzBjsARkkiCXVzZXIGOwBGaQdJIhBfY3NyZl90b2tlbgY7AEZJIjEwU3BVWkpNVXBNM2dGN2ZsT2lSMHgreFMzdFd2T3BKeXRWbFA2K2Erd3lBPQY7AEZJIglpbml0BjsAVFRJIg5yZXR1cm5fdG8GOwBGMA==--753eb4f6b07926596a2bcd9b2925c72d93a7e267; _core_session_id=ODNueS13OXplIDE0NjczNDA0OTIgNjMyYjcxNTIyZWZmIDZmNWFlMDI3MmY2YzY0YjFiODFiMmY3NTgxZGQ5NTJiM2RhM2E5MzY=; socrata-csrf-token=/+1vNjX7ttHA0ffeUcGyQRcoqD7XjhBu0LTEoPVEd6kuxztSpu8SHCDGQDtr5caG+3p263i0ghxl7YtLE/q0iQ=='

    request_id = '55c8a53595d246c6ac8e20dd2a9bcb71'

    it 'should call to Cetera and parse some responses' do
      VCR.use_cassette('cetera/user_search') do

        # Set this to whatever domain you re-record from, if you re-record this call
        CurrentDomain.set_domain(Domain.new('cname' => "opendata.rc-socrata.com"))

        search_result = Cetera::Utils.search_users(search_query, cookie_string, request_id)
        expect(search_result).to be_a(Cetera::Results::SearchResult)

        results = search_result.results
        expect(results.size).to eq(5) # Currently 5 results for Katie in RC

        results.each do |user|
          expect(user).to be_a(User)
          expect(user.id).to be_present
          expect(user.email).to be_present
          expect(user.screen_name).to be(user.displayName) # needed by FE view
          expect(user.role_name).to be(user.roleName) # role_name calls the property roleName
        end

        expect(results.any? { |user| user.role_name.nil? }).to be(true)
        expect(results.any? { |user| user.role_name == 'publisher_stories' }).to be(true)
        expect(results.any? { |user| user.role_name == 'viewer' }).to be(true)
      end
    end

    it 'should not return results when authentication fails' do
      VCR.use_cassette('cetera/user_search_bad_auth') do
        search_result = Cetera::Utils.search_users(search_query, nil, request_id)
        expect(search_result.results).to be_empty
      end
    end
  end

  describe 'get_derived_from_views' do
    let(:cookies) { 'i am a cookie' }
    let(:request_id) { 'iAmProbablyUnique' }

    let(:cetera_results) do
      cetera_payload = JSON.parse(File.read("#{Rails.root}/test/fixtures/cetera_search_results.json"))
      Cetera::Results::CatalogSearchResult.new(cetera_payload)
    end

    before(:each) do
      allow(CurrentDomain).to receive(:cname).and_return('unicorns')
    end

    it 'returns CeteraResultRow objects' do
      allow(Cetera::Utils).to receive(:search_views).and_return(cetera_results)
      result = Cetera::Utils.get_derived_from_views('data-lens', {})

      expect(result.first.class).to eq(Cetera::Results::ResultRow)
    end

    it 'invokes Cetera with limit and offset parameters' do
      expect(Cetera::Utils).to receive(:search_views).
        with(
          {
            search_context: 'unicorns',
            domains: ['unicorns'],
            derived_from: 'data-lens',
            offset: 20,
            limit: 30
          },
          cookies,
          request_id
        ).
        and_return(cetera_results)

      options = { offset: 20, limit: 30, cookie_string: cookies, request_id: request_id }
      Cetera::Utils.get_derived_from_views('data-lens', options)
    end

    it 'invokes Cetera with boost parameters' do
      expect(Cetera::Utils).to receive(:search_views).
        with(
          {
            search_context: 'unicorns',
            domains: ['unicorns'],
            derived_from: 'data-lens',
            boostCalendars: 100.0
          },
          cookies,
          request_id
        ).
        and_return(cetera_results)

      options = { boostCalendars: 100.0, cookie_string: cookies, request_id: request_id }
      Cetera::Utils.get_derived_from_views('data-lens', options)
    end

    it 'returns an empty array when Cetera returns a bad response' do
      allow(Cetera::Utils).to receive(:search_views).and_return(nil)
      options = { offset: nil, limit: 'purple', cookie_string: cookies, request_id: request_id }
      result = Cetera::Utils.get_derived_from_views('data-lens', options)

      expect(result).to be_a Array
      expect(result.length).to eq(0)
    end
  end

  describe 'search_profile_views' do
    context 'when logged in' do
      # NOTE: If you re-record the cassette, you'll need to replace this with whatever is getting
      # passed to Cetera & Core. Check the Cetera debug logs or puts forwardable_session_cookies.
      let(:cookies) { 'logged_in=true; _ga=GA1.1.764567635.1461627094; socrata-csrf-token=kuyEyHvf3%2FFzn8QU97z3ply5dlDzzClmsC7EsdPaeqYVVb39v8wyxs76Zg54mzXkkt48GAWN0%2FnrM4nv8%2FbnDA%3D%3D; _core_session_id=dzV1NS1zNnd5IDE0NzAxODQ0MjAgZDA3MDkyOWM5ZGVlIDRlYzI3MzIyZTFlN2Q5Y2E2ODc4OTMwYWE2N2Q4ODMyYzViMTA3ZjQ%3D; _socrata_session_id=BAh7CkkiD3Nlc3Npb25faWQGOgZFRkkiJTJkYmEzMWJhMTExN2ZlZGJjYjY2M2YyMDQyMmU5ZWE1BjsARkkiCXVzZXIGOwBGMEkiEF9jc3JmX3Rva2VuBjsARkkiMWg3azVOY1FUN1RlOVphSWFqeWZDUXM1blNrajJRZnFmV3gxTlhpQXNuYW89BjsARkkiCWluaXQGOwBUVEkiDnJldHVybl90bwY7AEYw--ef71c46553c8d78542f93e72a89094651e4b2178; mp_mixpanel__c=73' }
      let(:user_4x4) { 'w5u5-s6wy' }
      let(:domain) { 'localhost' }
      let(:basic_opts) { { :limit=>10, :page=>1, :for_user=>user_4x4, :nofederate=>true, :sortBy=>"newest", :publication_stage=>["published", "unpublished"], :id=>user_4x4, :domains=>[domain], :domain_boosts=>{}, :categories=>nil, :search_context=>domain } }

      before(:each) do
        CurrentDomain.set_domain(Domain.new('cname' => domain))
      end

      it 'returns correct results when searching for assets owned by user' do
        VCR.use_cassette('cetera/search_profile_views_owned') do
          search_result = Cetera::Utils.search_owned_by_user(basic_opts, cookies)
          expect(search_result).to be_a(Cetera::Results::SearchResult)

          results = search_result.results
          expect(results.size).to eq(1) # Currently 1 results for localhost Ricky
          expect(results[0]).to be_a(Cetera::Results::ResultRow)
          expect(results[0].id).to eq('em7z-qeb7') # Current result for localhost Ricky
        end
      end

      it 'returns correct results when searching for assets shared to user' do
        VCR.use_cassette('cetera/search_profile_views_shared') do
          search_result = Cetera::Utils.search_shared_to_user(basic_opts.merge(:shared_to => user_4x4), cookies)
          expect(search_result).to be_a(Cetera::Results::SearchResult)

          results = search_result.results
          expect(results.size).to eq(2) # Currently 2 results shared to localhost Ricky
          expect(results[0]).to be_a(Cetera::Results::ResultRow)
          expect(results[0].id).to eq('ij2u-iwtx')
          expect(results[1]).to be_a(Cetera::Results::ResultRow)
          expect(results[1].id).to eq('vkji-3zrf')
        end
      end

      it 'searching owned should not return results when authentication fails' do
        VCR.use_cassette('cetera/search_profile_views_bad_auth_owned') do
          owned_search_result = Cetera::Utils.search_owned_by_user(basic_opts, nil)
          expect(owned_search_result.results).to be_empty
        end
      end

      it 'searching shared should not return results when authentication fails' do
        VCR.use_cassette('cetera/search_profile_views_bad_auth_shared') do
          owned_search_result = Cetera::Utils.search_shared_to_user(basic_opts.merge(:shared_to => user_4x4), nil)
          expect(owned_search_result.results).to be_empty
        end
      end
    end

    context 'when not logged in' do
      it 'returns empty result set when Cetera returns a bad response, searching owned' do
        VCR.use_cassette('cetera/search_profile_views_owned_failed') do
          owned_search_result = Cetera::Utils.search_owned_by_user({}, nil, nil)
          expect(owned_search_result.results).to be_empty
        end
      end

      it 'returns empty result set when Cetera returns a bad response, searching shared' do
        VCR.use_cassette('cetera/search_profile_views_shared_failed') do
          owned_search_result = Cetera::Utils.search_shared_to_user({}, nil, nil)
          expect(owned_search_result.results).to be_empty
        end
      end
    end
  end

  describe 'get_tags' do
    let(:cookies) { 'i am a cookie' }
    let(:request_id) { 'iAmProbablyUnique' }

    it 'returns a TagCountResult with expected properties' do
      VCR.use_cassette('cetera/get_tags') do
        CurrentDomain.stub(:cname) { 'localhost' }

        results = Cetera::Utils.get_tags(cookies, request_id)

        expect(results.class).to eq(Cetera::Results::TagCountResult)
        expect(results.results[0].name).to eq('biz')
        expect(results.results[0].domain_tag).to eq('biz')
        expect(results.results[0].frequency).to eq(1)
        expect(results.results[0].count).to eq(1)
      end
    end

    it 'returns empty result set when Cetera returns a bad response' do
      VCR.use_cassette('cetera/failed_get_tags') do
        CurrentDomain.stub(:cname) { 'opendata.rc-socrata.com' }

        # fails because opendata.rc-socrata.com is not indexed on localhost
        results = Cetera::Utils.get_tags(cookies, request_id)

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
      metadata_tag: { 'Dataset-Information_Superhero' => 'Superman' }
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
      'Dataset-Information_Superhero' => 'Superman'
    }
  end
end
