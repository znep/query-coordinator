require 'rails_helper'
require_relative '../../lib/page_metadata_manager'

describe PageMetadataManager do

  include TestHelperMethods

  subject(:page_metadata_manager) { described_class.new }

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

end
