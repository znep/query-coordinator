require 'rails_helper'
require_relative '../../lib/page_metadata_manager'

describe PageMetadataManager do

  include TestHelperMethods

  subject(:page_metadata_manager) { described_class.new }

  describe '#page_metadata_from_vif' do

    it 'generates a pageMetadata object representing the visualization in the VIF as one card' do
      permissions = {
        :isPublic => true,
        :rights => %w(read write)
      }
      actual_result = page_metadata_manager.page_metadata_from_vif(vif_fixture, 'page-test', permissions)
      expected_result = vif_page_metadata_fixture

      expect(actual_result).to eq(expected_result)
    end

  end

  private

  def vif_fixture
    JSON.parse(File.read("#{Rails.root}/test/fixtures/vif.json")).with_indifferent_access
  end

  def vif_page_metadata_fixture
    # page metadata which should come from the VIF
    JSON.parse(File.read("#{Rails.root}/test/fixtures/vif-page-metadata.json")).with_indifferent_access
  end

end
