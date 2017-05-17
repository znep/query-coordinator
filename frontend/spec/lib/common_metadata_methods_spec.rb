require 'rails_helper'
require_relative '../../lib/common_metadata_methods'

describe CommonMetadataMethods do
  include TestHelperMethods

  class DummyClass
    include CommonMetadataMethods
  end

  let(:dummy_class_instance) { DummyClass.new }

  before do
    init_current_domain
    init_feature_flag_signaller

    allow_any_instance_of(Phidippides).to receive(:connection_details).
      and_return('address' => 'localpost', 'port' => 2402)
    allow_any_instance_of(Phidippides).to receive(:get_dataset_size).and_return(1)
  end

  describe '#flag_subcolumns!' do

    it 'flags subcolumns when there is a suffix' do
      columns_with_suffix = {
        'location_1' => {
          :name => 'Location'
        },
        'location_1_city' => {
          :name => 'Location (City)'
        }
      }

      dummy_class_instance.flag_subcolumns!(columns_with_suffix)
      expect(columns_with_suffix['location_1'][:isSubcolumn]).to eq(false)
      expect(columns_with_suffix['location_1_city'][:isSubcolumn]).to eq(true)
    end

    it 'flags subcolumns when there is not a suffix' do
      columns_no_suffix = {
        'location' => {
          :name => 'Location'
        },
        'location_city' => {
          :name => 'Location (City)'
        }
      }

      dummy_class_instance.flag_subcolumns!(columns_no_suffix)
      expect(columns_no_suffix['location'][:isSubcolumn]).to eq(false)
      expect(columns_no_suffix['location_city'][:isSubcolumn]).to eq(true)
    end

  end

  describe 'fetch_dataset_metadata' do
    before do
      # default mode, overridden for a few cases below
      rspec_stub_feature_flags_with(phidippides_deprecation_metadata_source: 'phidippides-only')
    end

    let(:options) do
      {
        :request_id => '12345',
        :cookies => 'abcde',
        :add_table_column => true
      }
    end

    let(:test_columns) do
      {
        'location' => {
          'name' => 'Location'
        },
        'location_city' => {
          'name' => 'Location (City)'
        }
      }.with_indifferent_access
    end

    before do
      allow_any_instance_of(DataLensManager).to receive(:fetch).and_return({
        :grants => {},
        :rights => ['view']
      })
      allow_any_instance_of(Phidippides).to receive(:fetch_dataset_metadata).and_return({
        :status => '200',
        :body => { :columns => test_columns }
      })
      allow(View).to receive(:migrations).and_return({
        obeId: 'kang-aroo',
        nbeId: 'elep-hant'
      })
      allow(View).to receive(:find).and_return(View.new(json_fixture('view_a83c-up9r.json')))
    end

    # NOTE: This is unaffected by phidippides_deprecation_metadata_source since it never used phiddy
    context 'data lens based on derived view' do
      let(:options) { { :is_from_derived_view => true } }

      before do
        allow(CurrentDomain).to receive(:cname).and_return('penguins.com')
        allow(I18n).to receive(:locale).and_return('en')
        allow(Column).to receive(:get_derived_view_columns).and_return(test_columns)
        allow_any_instance_of(Phidippides).to receive(:mirror_nbe_column_metadata!)
      end

      it 'requests the derived view dataset' do
        test_view = View.new({ 'owner' => { 'id' => 'pota-toes' } })
        expect(View).to receive(:find_derived_view_using_read_from_nbe).and_return(test_view)
        allow(test_view).to receive(:nbe_view).and_return(View.new({ 'id' => 'four-four' }))

        dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
      end

      it 'returns an object resembling Phidippides response' do
        test_view = View.new({ 'owner' => { 'id' => 'pota-toes' } })
        expect(View).to receive(:find_derived_view_using_read_from_nbe).and_return(test_view)
        allow(test_view).to receive(:nbe_view).and_return(View.new({ 'id' => 'four-four' }))

        result = dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
        expect(result.keys).to include('domain', 'locale', 'columns', 'ownerId', 'updatedAt')
      end

      it 'raises UnknownRequestError if Core throws an error' do
        allow(View).to receive(:find_derived_view_using_read_from_nbe).and_raise(CoreServer::Error)

        expect{
          dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
        }.to raise_error(CommonMetadataMethods::UnknownRequestError)
      end

    end

    context 'regular data lens' do

      context 'phidippides_deprecation_metadata_source = phidippides-only' do
        before do
          rspec_stub_feature_flags_with(phidippides_deprecation_metadata_source: 'phidippides-only')
        end

        it 'requests dataset metadata from phidippides' do
          expect_any_instance_of(Phidippides).to receive(:fetch_dataset_metadata)
          expect(View).not_to receive(:find)
          dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
        end
      end

      context 'phidippides_deprecation_metadata_source = core-only' do
        before do
          rspec_stub_feature_flags_with(phidippides_deprecation_metadata_source: 'core-only')
        end

        it 'requests dataset metadata from core' do
          expect_any_instance_of(Phidippides).not_to receive(:fetch_dataset_metadata)
          expect(View).to receive(:find).exactly(3).times
          dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
        end
      end

      context 'phidippides_deprecation_metadata_source = mixed-mode' do
        before do
          rspec_stub_feature_flags_with(phidippides_deprecation_metadata_source: 'mixed-mode')
        end

        it 'requests dataset metadata from both phidippides and core' do
          expect_any_instance_of(Phidippides).to receive(:fetch_dataset_metadata)
          expect(View).to receive(:find).exactly(3).times
          dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
        end
      end

      it 'raises AuthenticationRequired for 401 response from Phidippides' do
        expect_any_instance_of(Phidippides).to receive(:fetch_dataset_metadata).and_return({
          :status => '401',
          :body => {
            :columns => {
              'location' => {},
              'location_city' => {}
            }
          }
        })

        expect {
          dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
        }.to raise_error(CommonMetadataMethods::AuthenticationRequired)
      end

      it 'raises UnauthorizedDatasetMetadataRequest for 403 response from Phidippides' do
        expect_any_instance_of(Phidippides).to receive(:fetch_dataset_metadata).and_return({
          :status => '403',
          :body => {}
        })

        expect {
          dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
        }.to raise_error(CommonMetadataMethods::UnauthorizedDatasetMetadataRequest)
      end

      it 'raises DatasetMetadataNotFound for 404 response from Phidippides' do
        expect_any_instance_of(Phidippides).to receive(:fetch_dataset_metadata).and_return({
          :status => '404',
          :body => {}
        })

        expect {
          dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
        }.to raise_error(CommonMetadataMethods::DatasetMetadataNotFound)
      end

      it 'raises UnknownRequestError for other non-200 responses from Phidippides' do
        expect_any_instance_of(Phidippides).to receive(:fetch_dataset_metadata).and_return({
          :status => '500',
          :body => {}
        })

        expect {
          dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
        }.to raise_error(CommonMetadataMethods::UnknownRequestError)
      end

    end

    it 'decorates the metadata with permissions' do
      result = dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
      expect(result[:permissions][:rights]).to include('view')
    end

    it 'adds a table card to the metadata' do
      result = dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
      expect(result[:columns]['*']).not_to be_nil
    end

    it 'flags subcolumns' do
      result = dummy_class_instance.fetch_dataset_metadata('elep-hant', options)
      expect(result[:columns]['location_city'][:isSubcolumn]).to eq(true)
    end

  end

  describe 'fetch_dataset_metadata_for_derived_view' do
    let(:test_view) do
      View.new({
        'id' => 'peng-uins',
        'owner' => { 'id' => 'elep-hant' },
        'viewLastModified' => 12345
      })
    end

    before do
      allow(CurrentDomain).to receive(:cname).and_return('penguins.com')
      allow(I18n).to receive(:locale).and_return('en')
      allow(Column).to receive(:get_derived_view_columns).and_return({})
      allow(View).to receive(:find_derived_view_using_read_from_nbe).and_return(test_view)
      allow(test_view).to receive(:nbe_view).and_return(View.new({ 'id' => 'four-four' }))
      allow_any_instance_of(Phidippides).to receive(:mirror_nbe_column_metadata!)
    end

    it 'should add domain' do
      result = dummy_class_instance.fetch_dataset_metadata_for_derived_view(test_view.id)
      expect(result[:domain]).to eq('penguins.com')
    end

    it 'should add locale' do
      result = dummy_class_instance.fetch_dataset_metadata_for_derived_view(test_view.id)
      expect(result[:locale]).to eq('en')
    end

    it 'should call the Column class method to mimic phidippides column metadata' do
      test_columns = {
        'location' => {
          'name' => 'Location'
        },
        'location_city' => {
          'name' => 'Location (City)'
        }
      }.with_indifferent_access
      expect(Column).to receive(:get_derived_view_columns).and_return(test_columns)
      result = dummy_class_instance.fetch_dataset_metadata_for_derived_view(test_view.id)

      expect(result[:columns]).to eq(test_columns)
    end

    it 'should add ownerId' do
      result = dummy_class_instance.fetch_dataset_metadata_for_derived_view(test_view.id)
      expect(result[:ownerId]).to eq('elep-hant')
    end

    it 'should add updatedAt' do
      result = dummy_class_instance.fetch_dataset_metadata_for_derived_view(test_view.id)
      expect(result[:updatedAt]).to eq(Time.at(12345))
    end

    it 'should ad defaultId' do
      result = dummy_class_instance.fetch_dataset_metadata_for_derived_view(test_view.id)
      expect(result[:defaultId]).to eq('four-four')
    end

    it 'should use phidippides data column transformations' do
      expect_any_instance_of(Phidippides).to receive(:mirror_nbe_column_metadata!)
      dummy_class_instance.fetch_dataset_metadata_for_derived_view(test_view.id)
    end

  end

end
