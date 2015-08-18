require 'test_helper'
include Cetera

class CeteraTest < Test::Unit::TestCase

  describe 'Cetera' do

    def test_cetera_soql_params
      params = Cetera.cetera_soql_params
      assert params.is_a? String

      opts = {
        :local_data_hack => true,
        :limitTo => 'new_view',
        :q => 'giraffes are whack',
        :page => 4
      }
      params = Cetera.cetera_soql_params(opts)
      assert params.match(/domains=data.cityofchicago.org/)
      assert params.match(/search_context=data.cityofchicago.org/)
      assert params.match(/only=pages/)
      assert params.match(/q=giraffes are whack/)
      assert params.match(/offset=4/)
    end

    describe 'Displays' do

      def test_dataset
        dataset = Cetera::Displays::Dataset
        assert dataset.name == 'table'
        assert dataset.title == 'Table'
        assert dataset.type == 'blist'
        assert dataset.cetera_type == 'dataset'
      end

      def test_page
        dataset = Cetera::Displays::Page
        assert dataset.name == 'Data Lens page'
        assert dataset.title == 'Data Lens page'
        assert dataset.type == 'new_view'
        assert dataset.cetera_type == 'page'
      end
    end

    describe 'CeteraResultRow' do

      def test_cetera_result_row
        fakeRowData = JSON.parse(File.read("#{Rails.root}/test/fixtures/cetera_row_results.json"))
        row = Cetera::CeteraResultRow.new(fakeRowData)

        assert row.id == 'r8ea-mq83'
        assert row.link == 'https://data.cityofchicago.org/d/r8ea-mq83'
        assert row.name == 'Performance Metrics - Innovation & Technology - Site Availability'
        assert row.description == 'The website availability metrics below are derived from an automated monitor that sends a request every two minutes to each website. The website is considered unavailable if the response to any request takes longer than a pre-defined wait time. The monitors run continuously and are not normally disabled during scheduled maintenance or downtime, so the reported metrics incorporate both planned and unplanned downtime.'
        assert row.type == 'dataset'
        assert row.categories == ['public safety', 'infrastructure', 'economy']
        assert row.tags == []
        assert row.display_title == 'Table'
        assert row.display_class == 'Blist'
        assert row.icon_class == 'icon'
        assert row.default_page == '1234-abcd'
        assert row.new_view? == false
        assert row.federated? == false
        assert row.story? == false
        assert row.domainCName == 'data.cityofchicago.org'
      end
    end
  end
end
