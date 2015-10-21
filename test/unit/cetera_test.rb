require 'test_helper'

include Cetera

class CeteraTest < Test::Unit::TestCase
  describe 'Cetera' do
    def sample_search_options
      {
        domains: 'data.cityofchicago.org',
        limitTo: 'tables',
        q: 'giraffes are whack!&@*!',
        limit: 10,
        page: 4,
        metadata_tag: { 'Dataset-Information_Superhero' => 'Superman' }
      }
    end

    def expected_cetera_params
      {
        domains: 'data.cityofchicago.org',
        # search_context (CurrentDomain.cname) changes with test context so is not tested
        only: 'datasets',
        q: 'giraffes are whack!&@*!', # CGI.escape happens in search_views params.to_query
        limit: 10,
        offset: 30,
        'Dataset-Information_Superhero' => 'Superman'
      }
    end

    def test_cetera_soql_params_as_query
      params = Cetera.cetera_soql_params(sample_search_options)
      expected_cetera_params.each do |k, v|
        assert_equal(v, params[k], "Field: #{k}")
      end
    end

    def test_cetera_limit_type_translator
      frontend_to_cetera = {
        'data_lens' => 'datalenses',
        'new_view' => 'datalenses',
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
        assert_equal cetera_type, Cetera.translate_display_type(frontend_type)
      end
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
        assert_equal false, row.new_view?
        assert_equal false, row.story?
      end
    end
  end
end
