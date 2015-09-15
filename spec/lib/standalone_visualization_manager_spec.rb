require 'rails_helper'
require_relative '../../test/test_helper'
require_relative '../../lib/standalone_visualization_manager'

describe StandaloneVisualizationManager do

  include TestHelperMethods

  subject(:standalone_visualization_manager) { described_class.new }

  describe '#create' do

    it 'raises an exception if given an unknown display type' do
      # for now, data_lens_chart and data_lens_map are the known types

      vif = vif_fixture
      vif[:type] = 'data_lens'
      expect{ standalone_visualization_manager.create(vif, nil, nil, nil) }.to raise_error

    end

    before do
      init_current_domain

      allow_any_instance_of(SodaFountain).to receive(:connection_details).and_return({'address' => 'localhost', 'port' => 6010})

      stub_request(:post, "http://localhost:8080/views").
          with(:body => JSON.generate(vif_request_fixture),
               :headers => {'Accept'=>'*/*', 'Content-Type'=>'application/json', 'Cookie'=>'_core_session_id=123456', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
          to_return(:status => 200, :body => JSON.generate(vif_request_fixture), :headers => {})
    end

    it 'calls PageMetadataManager#fetch_dataset_columns with cookies for Core' do

      expect_any_instance_of(SodaFountain).to receive(:create_or_update_rollup_table)

      expect_any_instance_of(PageMetadataManager).to \
        receive(:fetch_dataset_columns).
            with('vdj8-z7h2', hash_including(:cookies => {:_core_session_id => 123})).
            and_return({'plausibility' => {}})
      standalone_visualization_manager.create(vif_fixture, 'Business', 'vdj8-z7h2', true, :cookies => {:_core_session_id => 123})
    end

  end

  describe '#page_metadata_from_vif' do

    it 'generates a pageMetadata object representing the visualization in the VIF as one card' do
      permissions = {
        :isPublic => true,
        :rights => %w(read write)
      }
      actual_result = standalone_visualization_manager.page_metadata_from_vif(vif_fixture, 'page-test', permissions)
      expected_result = vif_page_metadata_fixture

      # TODO: IT seems that the vif_page_metadata fixture should also have a "description" field in its lone card.
      # Confirm with Chris re: improvement.

      expect(actual_result).to eq(expected_result)
    end

  end

  private

  def vif_fixture
    JSON.parse(File.read("#{Rails.root}/test/fixtures/vif.json")).with_indifferent_access
  end

  def vif_request_fixture
    JSON.parse(File.read("#{Rails.root}/test/fixtures/vif-request.json")).with_indifferent_access
  end

  def vif_page_metadata_fixture
    # page metadata which should come from the VIF
    JSON.parse(File.read("#{Rails.root}/test/fixtures/vif-page-metadata.json")).with_indifferent_access
  end

end
