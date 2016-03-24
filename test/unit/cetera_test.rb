require 'test_helper'

include Cetera

class CeteraTest < Minitest::Test
  describe 'Cetera' do
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

    def test_cetera_soql_params_as_query
      params = Cetera.cetera_soql_params(sample_search_options)

      expected_cetera_params.each do |key, expected|
        actual = params[key]
        assert_equal expected, actual, "Field: #{key} expected #{expected} but was #{actual}"
      end
    end

    def test_cetera_limit_type_translator
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
        assert_equal cetera_type, Cetera.translate_display_type(frontend_type, 'dataset')
      end

      assert_equal 'filters', Cetera.translate_display_type('tables', 'view')
    end

    describe 'Displays' do
      def test_dataset
        dataset = Cetera::Displays::Dataset
        assert dataset.name == 'table'
        assert dataset.title == 'Table'
        assert dataset.type == 'blist'
      end

      def test_file
        file = Cetera::Displays::File
        assert_equal 'non-tabular file or document', file.name
        assert_equal 'blob', file.type
      end

      def test_link
        link = Cetera::Displays::Link
        assert_equal 'external dataset', link.name
        assert_equal 'href', link.type
      end

      def test_map
        map = Cetera::Displays::Map
        assert_equal 'map', map.name
        assert_equal 'map', map.type
      end
    end

    describe 'CeteraResultRow' do
      def sample_result_row
        @sample_result_row ||=
          begin
            hash = JSON.parse(File.read("#{Rails.root}/test/fixtures/cetera_row_results.json"))
            Cetera::CeteraResultRow.new(hash)
          end
      end

      def test_cetera_result_row_delegators
        row = sample_result_row
        assert_equal 'r8ea-mq83', row.id
        assert_equal 'https://data.cityofchicago.org/d/r8ea-mq83', row.link
        assert_equal 'Performance Metrics - Innovation & Technology - Site Availability', row.name
        assert_match(/availability metrics/, row.description)
        assert_equal 'dataset', row.type
        assert_equal ['Administration & Finance'], row.categories
        assert_equal ['administration', 'finance'], row.tags
      end

      def test_cetera_result_row_other_methods
        row = sample_result_row
        assert_equal '1234-abcd', row.default_page
        assert_equal 'Blist', row.display_class
        assert_equal 'Table', row.display_title
        assert_equal 'data.cityofchicago.org', row.domainCName
        assert_equal true, row.federated?
        assert_equal 'icon', row.icon_class
        assert_equal false, row.story?
      end
    end

    def test_cetera_sort_order_translator
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
        assert_equal cetera_type, Cetera.translate_sort_by(frontend_type)
      end

      ['bogus', 'sort by', 'orders'].each do |bogus|
        assert_raises KeyError do
          Cetera.translate_sort_by(bogus)
        end
      end
    end

    describe 'search_views' do
      def test_cetera_search_views_raises_timeout_error_on_timeout
        query = { domains: ['example.com'] }
        stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
          with(query: Cetera.cetera_soql_params(query)).
          to_timeout

        assert_raises TimeoutError do
          Cetera.search_views(query, {}, 'Unvailable')
        end
      end

      def test_cookies_and_request_id_get_passed_along_to_cetera
        query = { domains: ['example.com'] }
        cookies = { 'i am a cookie' => 'of oatmeal and raisins',
                    'i am also a cookie' => 'of chocolate chips' }
        request_id = 'iAmProbablyUnique'

        stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
          with(headers: { 'Cookie' => cookies.map { |key, val| "#{key}=#{val}" }.join('; '),
                          'X-Socrata-RequestId' => request_id },
               query: Cetera.cetera_soql_params(query)).
          to_return(status: 500, body: 'I cannot be parsed!')

        # Unsuccessful response returns false, just sayin'
        assert_equal false, Cetera.search_views(query, cookies, request_id)
      end

      def test_for_user_param_gets_passed_along_to_cetera
        domain = 'data.redmond.gov'
        CurrentDomain.stubs(:cname).returns(domain)
        query = {
          domains: [domain],
          for_user: '7kqh-9s5a'
        }

        cetera_soql_params = Cetera.cetera_soql_params(query)
        assert_includes cetera_soql_params, :for_user

        response = {
          'results' => [],
          'resultSetSize' => 0,
          'timings' => { 'serviceMillis' => 118, 'searchMillis' => [2, 2] }
        }

        stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
          with(query: cetera_soql_params).
          to_return(status: 200, body: response.to_json)

        res = Cetera.search_views(query, {}, 'funnyId')

        assert_equal 0, res.count
        assert_equal response, res.data.to_hash
        assert_empty res.results
      end
    end
  end
end
