require 'rails_helper'
require_relative '../../lib/page_metadata_manager'

describe PageMetadataManager do

  include TestHelperMethods

  let(:subject) { described_class.new }

  let(:vif_fixture) {
    JSON.parse(File.read("#{Rails.root}/test/fixtures/vif.json")).with_indifferent_access
  }

  let(:vif_page_metadata_fixture) {
    # page metadata which should come from the VIF
    JSON.parse(File.read("#{Rails.root}/test/fixtures/vif-page-metadata.json")).with_indifferent_access
  }

  let(:page_metadata_with_search_cards) {
    JSON.parse(File.read("#{Rails.root}/spec/fixtures/page_metadata_with_search_cards.json")).with_indifferent_access
  }

  let(:page_metadata_without_search_cards) {
    JSON.parse(File.read("#{Rails.root}/spec/fixtures/page_metadata_without_search_cards.json")).with_indifferent_access
  }

  let(:view_json) {
    JSON.parse(File.read("#{Rails.root}/spec/fixtures/view_a83c-up9r.json"))
  }

  let(:v2_page_metadata) {
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v2-page-metadata.json")).with_indifferent_access
  }

  let(:data_lens_page_metadata) { v2_page_metadata['displayFormat']['data_lens_page_metadata'] }

  before(:each) do
    init_feature_flag_signaller
  end

  describe '#page_metadata_from_vif' do

    it 'generates a pageMetadata object representing the visualization in the VIF as one card' do
      permissions = {
        :isPublic => true,
        :rights => %w(read write)
      }
      actual_result = subject.page_metadata_from_vif(vif_fixture, 'page-test', permissions)
      expected_result = vif_page_metadata_fixture

      expect(actual_result).to eq(expected_result)
    end

  end

  describe '#show' do
    before do
      init_current_domain
    end

    let(:uid) { 'tyia-pmfq' }
    let(:result) { subject.show(uid) }

    it 'returns properties hash' do
      VCR.use_cassette('page_metadata_manager') do
        expected_keys = %w(
          cards datasetId description name pageId primaryAggregation primaryAmountField version
          permissions hideFromCatalog hideFromDataJson shares rights provenance ownerDisplayName ownerId
          isFromDerivedView
        )

        expect(result.keys.sort).to eq(expected_keys.sort)
      end
    end

    context 'when data lens is public' do
      let(:uid) { 'tyia-pmfq' }

      it 'returns correct permissions and keys' do
        VCR.use_cassette('page_metadata_manager', :allow_playback_repeats => true) do
          expect(result['permissions']).to eq({'isPublic' => true, 'rights' => ['read']})
        end
      end
    end

    context 'when data lens is private' do
      let(:uid) { 'cfa5-i2ky' }

      it 'returns correct permissions and keys' do
        VCR.use_cassette('page_metadata_manager', :allow_playback_repeats => true) do
          expect(result['permissions']).to eq({'isPublic' => false, 'rights' => []})
        end
      end
    end

    context 'when authentication is required' do
      let(:uid) { 'rrgq-keyp' }

      it 'raises ViewAuthenticationRequired' do
        VCR.use_cassette('page_metadata_manager', :allow_playback_repeats => true) do
          expect { result['permissions'] }.to raise_error(DataLensManager::ViewAuthenticationRequired)
        end
      end
    end

    context 'when authorization is required' do
      let(:uid) { 'g34u-2aa5' }

      it 'raises ViewAccessDenied' do
        VCR.use_cassette('page_metadata_manager', :allow_playback_repeats => true) do
          expect { result['permissions'] }.to raise_error(DataLensManager::ViewAccessDenied)
        end
      end
    end
  end

  describe '#create' do

    before do
      init_current_domain
      allow(View).to receive(:find).and_return(View.new(view_json))
      allow_any_instance_of(DataLensManager).to receive(:create)
      allow(subject).to receive(:update_metadata_rollup_table)
    end

    it 'requests soda fountain secondary index when search cards are present' do
      VCR.use_cassette('page_metadata_manager') do
        expect(subject).to receive(:request_soda_fountain_secondary_index).once
        subject.create(page_metadata_with_search_cards)
      end
    end

    it 'does not request soda fountain secondary index when search cards are absent' do
      VCR.use_cassette('page_metadata_manager') do
        expect(subject).to receive(:request_soda_fountain_secondary_index).never
        subject.create(page_metadata_without_search_cards)
      end
    end

    it 'uses category from dataset_category' do
      VCR.use_cassette('page_metadata_manager') do
        category = 'category of the ages'
        allow(subject).to receive(:dataset_category).with(data_lens_page_metadata['datasetId']).and_return(category)
        expect_any_instance_of(DataLensManager).to receive(:create).with(category, anything()).and_return('fdsa-fdsa')
        subject.create(data_lens_page_metadata)
      end
    end

  end

  describe '#update' do

    before do
      init_current_domain
      allow(View).to receive(:find).and_return(View.new(view_json))
      allow_any_instance_of(CoreServer::Connection).to receive(:update_request).and_return('{}')
      allow(subject).to receive(:update_metadata_rollup_table)
    end

    it 'requests soda fountain secondary index when search cards are present' do
      VCR.use_cassette('page_metadata_manager') do
        expect(subject).to receive(:request_soda_fountain_secondary_index).once
        subject.update(page_metadata_with_search_cards)
      end
    end

    it 'does not request soda fountain secondary index when search cards are absent' do
      VCR.use_cassette('page_metadata_manager') do
        expect(subject).to receive(:request_soda_fountain_secondary_index).never
        subject.update(page_metadata_without_search_cards)
      end
    end

  end

  describe '#fetch_dataset_columns' do
    let(:dataset_id) { 'ij2u-iwtx' }
    let(:request_options) do
      { request_id: 'request_id' }
    end

    let(:result) { subject.fetch_dataset_columns(dataset_id, request_options) }

    before do
      init_current_domain
    end

    context 'when call to fetch_dataset_metadata is successful' do
      it 'returns columns' do
        mock_metadata = { :columns => :test_columns }.with_indifferent_access

        expect(subject).to receive(:fetch_dataset_metadata).
          with(dataset_id, request_options).
          and_return(mock_metadata)

        expect(result).to eq(:test_columns)
      end
    end

    context 'when call to core is not successful' do
      it 'raises NoDatasetMetadataException' do
        mock_metadata = { :columns => :test_columns }

        expect(subject).to receive(:fetch_dataset_metadata).
          with(dataset_id, request_options).
          and_raise(StandardError.new)

        expect { result }.to raise_error(PageMetadataManager::NoDatasetMetadataException)
      end
    end
  end

  describe '#dataset_category' do
    let(:obe_category_name) { 'obe_test_category' }
    let(:nbe_category_name) { 'nbe_test_category' }
    let(:nbe_dataset_id) { 'thw2-8btq' }
    let(:obe_dataset_id) { 'nrhw-r55e' }
    let(:dataset_id) { nil } # Set in contexts below

    let(:obe_view) {
      double('obe view',
        category: obe_category_name,
        migrations: stub_migrations
      )
    }

    let(:nbe_view) {
      double('nbe view',
        category: nbe_category_name,
        migrations: stub_migrations
      )
    }

    let(:result) { subject.send(:dataset_category, dataset_id) }

    before do
      allow(View).to receive(:find).with(obe_dataset_id).and_return(obe_view)
      allow(View).to receive(:find).with(nbe_dataset_id).and_return(nbe_view)
    end

    context 'when passing in obe id' do
      let(:dataset_id) { obe_dataset_id }

      context 'when migrations exist' do
        it 'returns obe category' do
          expect(result).to eq(obe_category_name)
        end
      end

      context 'when no migrations exist' do
        let(:obe_dataset_id) { 'anot-her1' } # need to do this to account for migration stub
        let(:mock_response) { Struct.new(:code) }

        before do
          allow(View).to receive(:find).with(stub_migrations['obeId']).and_raise(
            CoreServer::ResourceNotFound.new(mock_response.new(404))
          )
        end

        it 'returns obe category' do
          expect(result).to eq(obe_category_name)
        end
      end

      context 'when core server returns an error' do
        before do
          allow(View).to receive(:find).with(stub_migrations['obeId']).and_raise(CoreServer::Error.new)
        end

        it 'returns nil' do
          expect(result).to be_nil
        end
      end
    end

    context 'when passing in nbe id' do
      let(:dataset_id) { nbe_dataset_id }

      context 'when migrations exist' do
        it 'returns obe category' do
          expect(result).to eq(obe_category_name)
        end
      end

      context 'when no migrations exist' do
        let(:mock_response) { Struct.new(:code) }

        before do
          MockResponse = Struct.new(:code)
          allow(View).to receive(:find).with(stub_migrations['obeId']).and_raise(
            CoreServer::ResourceNotFound.new(mock_response.new(404))
          )
        end

        it 'returns nbe category' do
          expect(result).to eq(nbe_category_name)
        end
      end

      context 'when core server returns an error' do
        before do
          allow(View).to receive(:find).with(stub_migrations['obeId']).and_raise(CoreServer::Error.new)
        end

        it 'returns nil' do
          expect(result).to be_nil
        end
      end
    end

    def stub_migrations
      JSON.parse(
        '{
          "lastSyncJobId" : "acd092ee-008d-4473-8776-7d3e26ddc061",
          "nbeId" : "up67-qs3z",
          "obeId" : "nrhw-r55e",
          "syncedAt" : 1426732353
        }'
      )
    end
  end

  describe '#build_rollup_soql' do

    let(:v1_dataset_metadata) {
      JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata.json"))
    }

    let(:columns) { v1_dataset_metadata.fetch('columns') }
    let(:cards) { data_lens_page_metadata.fetch('cards') }

    let(:result) { subject.build_rollup_soql(data_lens_page_metadata, columns, cards) }

    before do
      allow(subject).to receive(:fetch_min_max_in_column).and_return({
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      })
    end

    it 'returns roll-up query' do
      expected_soql = %q{
        select
          some_column,
          some_other_column,
          :@computed_region_four_four,
          date_trunc_y(time_column_fine_granularity),
          signed_magnitude_10(some_number_column),
          signed_magnitude_linear(some_other_number_column, 500),
          count(*) as COLUMN_ALIAS_GUARD__VALUE
        group by
          some_column,
          some_other_column,
          :@computed_region_four_four,
          date_trunc_y(time_column_fine_granularity),
          signed_magnitude_10(some_number_column),
          signed_magnitude_linear(some_other_number_column, 500)
      }.gsub(/\s+/, ' ').strip

      expect(result).to eq(expected_soql)
    end

    it 'returns no duplicate columns' do
      cards.push(cards.first) # Duplicate the first card

      expected_soql = %q{
        select
          some_column,
          some_other_column,
          :@computed_region_four_four,
          date_trunc_y(time_column_fine_granularity),
          signed_magnitude_10(some_number_column),
          signed_magnitude_linear(some_other_number_column, 500),
          count(*) as COLUMN_ALIAS_GUARD__VALUE
        group by
          some_column,
          some_other_column,
          :@computed_region_four_four,
          date_trunc_y(time_column_fine_granularity),
          signed_magnitude_10(some_number_column),
          signed_magnitude_linear(some_other_number_column, 500)
      }.gsub(/\s+/, ' ').strip

      expect(result).to eq(expected_soql)
    end

    context 'with aggregation' do
      let(:primary_amount_field) { 'sum_column' }
      let(:primary_aggregation) { 'sum' }
      let(:data_lens_page_metadata) {
        v2_page_metadata['displayFormat']['data_lens_page_metadata'].tap do |page_metadata|
          page_metadata['primaryAmountField'] = primary_amount_field
          page_metadata['primaryAggregation'] = primary_aggregation
        end
      }

      it 'uses default aggregation' do
        expect(result).to match(/#{primary_aggregation}\(#{primary_amount_field}\) as COLUMN_ALIAS_GUARD__VALUE/)
      end
    end

    context 'with card-level aggregation' do
      let(:default_amount_field) { 'default_column' }
      let(:default_aggregation) { 'default_function' }
      let(:primary_amount_field) { 'count_column' }
      let(:primary_aggregation) { 'count' }
      let(:data_lens_page_metadata) {
        v2_page_metadata['displayFormat']['data_lens_page_metadata'].tap do |page_metadata|
          page_metadata['primaryAmountField'] = default_amount_field
          page_metadata['primaryAggregation'] = default_aggregation
          page_metadata[:cards][0]['aggregationField'] = primary_amount_field
          page_metadata[:cards][0]['aggregationFunction'] = primary_aggregation
        end
      }

      it 'adds card aggregation' do
        expect(result).to match(/#{primary_aggregation}\(#{primary_amount_field}\),/)
      end

      it 'adds default aggregation' do
        expect(result).to match(/#{default_aggregation}\(#{default_amount_field}\) as COLUMN_ALIAS_GUARD__VALUE/)
      end
    end

    context 'with multiple card-level aggregations' do
      let(:data_lens_page_metadata) {
        v2_page_metadata['displayFormat']['data_lens_page_metadata'].tap do |page_metadata|
          page_metadata[:cards][0]['aggregationField'] = first_amount_field
          page_metadata[:cards][0]['aggregationFunction'] = first_aggregation
          page_metadata[:cards][1]['aggregationField'] = second_amount_field
          page_metadata[:cards][1]['aggregationFunction'] = second_aggregation
        end
      }

      context 'with different aggregations' do
        let(:first_amount_field) { 'column' }
        let(:first_aggregation) { 'count' }
        let(:second_amount_field) { 'other_column' }
        let(:second_aggregation) { 'sum' }

        it 'adds both aggregations' do
          expect(result).to match(/#{first_aggregation}\(#{first_amount_field}\)/)
          expect(result).to match(/#{second_aggregation}\(#{second_amount_field}\)/)
        end
      end

      context 'with duplicate aggregations' do
        let(:first_amount_field) { 'column' }
        let(:first_aggregation) { 'count' }
        let(:second_amount_field) { 'column' }
        let(:second_aggregation) { 'count' }

        it 'adds both aggregations' do
          expect(result).to match(/#{first_aggregation}\(#{first_amount_field}\)/)
          expect(result).to match(/#{second_aggregation}\(#{second_amount_field}\)/)
        end
      end

      context 'with nil aggregations' do
        let(:first_amount_field) { 'column' }
        let(:first_aggregation) { 'sum' }
        let(:second_amount_field) { nil }
        let(:second_aggregation) { 'count' }

        it 'adds non-nil aggregation' do
          expect(result).to match(/#{first_aggregation}\(#{first_amount_field}\)/)
        end

        it 'does not add nil aggregation' do
          expect(result).to_not match(/#{second_aggregation}\(#{second_amount_field}\)\(/)
        end
      end

      context 'with nil aggregation function' do
        let(:first_amount_field) { 'column' }
        let(:first_aggregation) { 'sum' }
        let(:second_amount_field) { 'other_column' }
        let(:second_aggregation) { nil }

        it 'adds non-nil aggregation' do
          expect(result).to match(/#{first_aggregation}\(#{first_amount_field}\)/)
        end

        it 'does not add nil aggregation' do
          expect(result).to_not match(/\(#{second_amount_field}\)/)
        end
      end

      context 'with multiple nil aggregations' do
        let(:default_amount_field) { 'default_column' }
        let(:default_aggregation) { 'default_function' }
        let(:first_amount_field) { nil }
        let(:first_aggregation) { 'sum' }
        let(:second_amount_field) { 'other_column' }
        let(:second_aggregation) { nil }

        let(:data_lens_page_metadata) {
          v2_page_metadata['displayFormat']['data_lens_page_metadata'].tap do |page_metadata|
            page_metadata['primaryAmountField'] = default_amount_field
            page_metadata['primaryAggregation'] = default_aggregation
            page_metadata[:cards][0]['aggregationField'] = first_amount_field
            page_metadata[:cards][0]['aggregationFunction'] = first_aggregation
            page_metadata[:cards][1]['aggregationField'] = second_amount_field
            page_metadata[:cards][1]['aggregationFunction'] = second_aggregation
          end
        }

        it 'adds default aggregation' do
          expect(result).to match(/#{default_aggregation}\(#{default_amount_field}\)/)
        end

        it 'does not add nil aggregation' do
          expect(result).to_not match(/#{first_aggregation}\(/)
          expect(result).to_not match(/\(#{second_amount_field}\)/)
        end
      end

      context 'with nil default field' do
        let(:default_amount_field) { nil }
        let(:default_aggregation) { 'default_function' }
        let(:first_amount_field) { nil }
        let(:first_aggregation) { 'sum' }
        let(:second_amount_field) { 'other_column' }
        let(:second_aggregation) { nil }

        let(:data_lens_page_metadata) {
          v2_page_metadata['displayFormat']['data_lens_page_metadata'].tap do |page_metadata|
            page_metadata['primaryAmountField'] = default_amount_field
            page_metadata['primaryAggregation'] = default_aggregation
            page_metadata[:cards][0]['aggregationField'] = first_amount_field
            page_metadata[:cards][0]['aggregationFunction'] = first_aggregation
            page_metadata[:cards][1]['aggregationField'] = second_amount_field
            page_metadata[:cards][1]['aggregationFunction'] = second_aggregation
          end
        }

        it 'adds count(*) aggregation' do
          expect(result).to match(/count\(\*\) as COLUMN_ALIAS_GUARD__VALUE/)
        end

        it 'does not add nil aggregation' do
          expect(result).to_not match(/#{default_aggregation}\(/)
          expect(result).to_not match(/#{first_aggregation}\(/)
          expect(result).to_not match(/\(#{second_amount_field}\)/)
        end
      end

      context 'with nil default function' do
        let(:default_amount_field) { 'default_column' }
        let(:default_aggregation) { nil }
        let(:first_amount_field) { nil }
        let(:first_aggregation) { 'sum' }
        let(:second_amount_field) { 'other_column' }
        let(:second_aggregation) { nil }

        let(:data_lens_page_metadata) {
          v2_page_metadata['displayFormat']['data_lens_page_metadata'].tap do |page_metadata|
            page_metadata['primaryAmountField'] = default_amount_field
            page_metadata['primaryAggregation'] = default_aggregation
            page_metadata[:cards][0]['aggregationField'] = first_amount_field
            page_metadata[:cards][0]['aggregationFunction'] = first_aggregation
            page_metadata[:cards][1]['aggregationField'] = second_amount_field
            page_metadata[:cards][1]['aggregationFunction'] = second_aggregation
          end
        }

        it 'adds count(*) aggregation' do
          expect(result).to match(/count\(\*\) as COLUMN_ALIAS_GUARD__VALUE/)
        end

        it 'does not add nil aggregation' do
          expect(result).to_not match(/\(#{default_amount_field}\)/)
          expect(result).to_not match(/#{first_aggregation}\(/)
          expect(result).to_not match(/\(#{second_amount_field}\)/)
        end
      end
    end

  end
end
