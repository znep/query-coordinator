require 'rails_helper'

describe Cetera do
  include TestHelperMethods

  it 'should handle cetera soql params as query' do
    params = Cetera.cetera_soql_params(sample_search_options)

    expected_cetera_params.each do |key, expected|
      actual = params[key]
      expect(actual).to eq(expected)
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
      expect(Cetera.translate_display_type(frontend_type, 'dataset')).to eq(cetera_type)
    end

    expect(Cetera.translate_display_type('tables', 'view')).to eq('filters')
  end

  describe 'Displays' do
    it 'should test_dataset' do
      dataset = Cetera::Displays::Dataset
      expect(dataset.name).to eq('table')
      expect(dataset.title).to eq('Table')
      expect(dataset.type).to eq('blist')
    end

    it 'should test_file' do
      file = Cetera::Displays::File
      expect(file.name).to eq('non-tabular file or document')
      expect(file.type).to eq('blob')
    end

    it 'should test_link' do
      link = Cetera::Displays::Link
      expect(link.name).to eq('external dataset')
      expect(link.type).to eq('href')
    end

    it 'should test_map' do
      map = Cetera::Displays::Map
      expect(map.name).to eq('map')
      expect(map.type).to eq('map')
    end
  end

  describe 'CeteraResultRow' do
    let(:sample_result_row) do
      hash = JSON.parse(File.read("#{Rails.root}/test/fixtures/cetera_row_results.json"))
      Cetera::CeteraResultRow.new(hash)
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
          'classification' => { 'domain_category' => 'pants',
                                'domain_tags' => %w(tubes, legs) }
        }
        actual = Cetera::CeteraResultRow.new(mini_response)
        expect(actual.display).to eq(expected)
      end
    end
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
      expect(Cetera.translate_sort_by(frontend_type)).to eq(cetera_type)
    end

    ['bogus', 'sort by', 'orders'].each do |bogus|
      expect { Cetera.translate_sort_by(bogus) }.to raise_error(KeyError)
    end
  end

  describe 'search_views' do
    it 'should test_cetera_search_views_raises_timeout_error_on_timeout' do
      query = { domains: ['example.com'] }
      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: Cetera.cetera_soql_params(query)).
        to_timeout

      expect { Cetera.search_views(query, nil, 'Unvailable') }.to raise_error(Timeout::Error)
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
             query: Cetera.cetera_soql_params(query)).
        to_return(status: 500, body: 'I cannot be parsed!')

      # Unsuccessful response returns false, just sayin'
      expect(Cetera.search_views(query, cookies, request_id)).to eq(false)
    end

    it 'should test_for_user_param_gets_passed_along_to_cetera' do
      domain = 'data.redmond.gov'
      init_current_domain
      allow(CurrentDomain).to receive(:cname).and_return(domain)
      query = {
        domains: [domain],
        for_user: '7kqh-9s5a'
      }

      cetera_soql_params = Cetera.cetera_soql_params(query)
      expect(cetera_soql_params).to include(:for_user)

      response = {
        'results' => [],
        'resultSetSize' => 0,
        'timings' => { 'serviceMillis' => 118, 'searchMillis' => [2, 2] }
      }

      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: cetera_soql_params).
        to_return(status: 200, body: response.to_json)

      res = Cetera.search_views(query, nil, 'funnyId')

      expect(res.data.to_hash).to eq(response)
      expect(res.results).to be_empty
    end
  end

  describe 'Cetera user search' do
    search_query = 'socrata.com'

    # NOTE: If you re-record the cassette, you'll need to replace this with whatever is getting
    # passed to Cetera & Core. Check the Cetera debug logs or puts forwardable_session_cookies.
    cookie_string = 'logged_in=true; _socrata_session_id=BAh7CkkiD3Nlc3Npb25faWQGOgZFRkkiJWFiYjg5NWJjZTdiYzMwNGM0YTA4MDQ2YjNhYzk1MjJlBjsARkkiCXVzZXIGOwBGMEkiEF9jc3JmX3Rva2VuBjsARkkiMVpjblBZUm9uYllOQTFkS3NFSjMwdTk2a1A1djNmSlgrVk9mcUdnK1R5OVk9BjsARkkiCWluaXQGOwBUVEkiDnJldHVybl90bwY7AEYw--542ee4041debe2e56bb7b670253193a91b7f0b9e; _core_session_id=ODNueS13OXplIDE0NjcwODc1NTUgNmU4MGU2N2FlYWYyIGU2YzE0NmIzNDRjZTcxM2ZlNTdmMmNlNWMwYzEzMzNiYjExMTVhOGQ; socrata-csrf-token=FaLWHLnxbMVDIPEnQn+SIQbDxpikR9bGm7EZAQj9XfNwaxl9o9YBRgP1I4tS4maa2Gf5A1M7QzjPVvMbB26WJQ=='

    request_id = '55c8a53595d246c6ac8e20dd2a9bcb71'

    it 'should call to Cetera and parse some responses' do
      VCR.use_cassette('cetera/user_search') do
        search_result = Cetera.search_users(search_query, cookie_string, request_id)
        expect(search_result).to be_a(Cetera::SearchResult)

        results = search_result.results
        expect(results.size).to eq(200) # old Core limit, let's not OOM

        # Documenting behavior, may not be desired:
        # Cetera's /whitepages resultSetSize is inconsistent with Cetera's /catalog resultSetSize
        # /whitepage's means total in payload, /catalog's means total matching query
        expect(results.count).to eq(200)

        results.each do |user|
          expect(user).to be_a(User)
          expect(user.id).to be_present
          expect(user.email).to be_present
          expect(user.screen_name).to be(user.displayName) # needed by FE view
        end
      end
    end

    it 'should not return results when authentication fails' do
      VCR.use_cassette('cetera/user_search_bad_auth') do
        search_result = Cetera.search_users(search_query, cookie_string.reverse, request_id)
        expect(search_result.results).to be_empty
      end
    end
  end

  private

  def sample_search_options
    {
      domains: ['data.cityofchicago.org', 'data.example.com', 'datacatalog.cookcountyil.gov'],
      domain_boosts: { 'data.example.com' => 0.808, 'datacatalog.cookcountyil.gov' => 0.909 },
      limitTo: 'tables',
      q: 'giraffes are whack!&@*!',
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
      limit: 10,
      offset: 30,
      categories: ['Traffic, Parking, and Transportation', 'And another thing'],
      'Dataset-Information_Superhero' => 'Superman'
    }
  end

end
