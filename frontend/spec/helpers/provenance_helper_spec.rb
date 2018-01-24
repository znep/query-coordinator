require 'rails_helper'
require 'spec_helper'

describe Browse2Helper do

  include TestHelperMethods

  before do
    init_current_domain
    init_feature_flag_signaller
  end

  describe 'normalized_provenance' do

    it 'should normalize nil to empty string' do
      expect(helper.normalized_provenance(nil)).to eq('')
    end

    it 'should return the same value for anything other than "official"' do
      expect(helper.normalized_provenance('foo')).to eq('foo')
      expect(helper.normalized_provenance('community')).to eq('community')
    end

    it 'should return "official2" when the value is "official"' do
      expect(helper.normalized_provenance('official')).to eq('official2')
    end

  end

  describe 'disable_authority_badge' do
    let(:disable_authority_badge) { 'none' }

    before do
      stub_feature_flags_with(:disable_authority_badge => disable_authority_badge)
    end

    context 'disable authority badge is "none"' do

      it 'should return false for all provenance values' do
        expect(helper.disable_authority_badge?('official')).to be_falsey
        expect(helper.disable_authority_badge?('community')).to be_falsey
        expect(helper.disable_authority_badge?(nil)).to be_falsey
      end

    end

    context 'disable authority badge is "all"' do
      let(:disable_authority_badge) { 'all' }

      it 'should return true for all provenance values' do
        expect(helper.disable_authority_badge?('official')).to be_truthy
        expect(helper.disable_authority_badge?('community')).to be_truthy
        expect(helper.disable_authority_badge?(nil)).to be_truthy
      end

    end

    context 'disable authority badge is "community"' do
      let(:disable_authority_badge) { 'community' }

      it 'should return true when provenance is "community"' do
        expect(helper.disable_authority_badge?('community')).to be_truthy
      end

      it 'should return false for other provanance values' do
        expect(helper.disable_authority_badge?('official')).to be_falsey
        expect(helper.disable_authority_badge?(nil)).to be_falsey
      end
    end

    context 'disable authority badge is "official2"' do
      let(:disable_authority_badge) { 'official2' }

      it 'should return true when provenance is "official"' do
        expect(helper.disable_authority_badge?('official')).to be_truthy
      end

      it 'should return false for other provanance values' do
        expect(helper.disable_authority_badge?('community')).to be_falsey
        expect(helper.disable_authority_badge?(nil)).to be_falsey
      end
    end

  end

  describe 'show_provenance_badge_in_old_catalog?' do
    let(:enable_data_lens_provenance) { true }
    let(:data_lens) { false }

    before do
      stub_feature_flags_with(:enable_data_lens_provenance => enable_data_lens_provenance)
      allow_any_instance_of(View).to receive(:data_lens?).and_return(data_lens)
    end

    context 'when view is not a data lens' do

      it 'should defer to the disable_authority_badge? method' do
        expect(helper).to receive(:disable_authority_badge?).and_return(false)
        expect(helper.show_provenance_badge_in_old_catalog?(View.new)).to be_truthy
        expect(helper).to receive(:disable_authority_badge?).and_return(true)
        expect(helper.show_provenance_badge_in_old_catalog?(View.new)).to be_falsey
      end

    end

    context 'when view is a data lens' do
      let(:data_lens) { true }

      it 'should defer to the enable_data_lens_provenance feature flag' do
        stub_feature_flags_with(:enable_data_lens_provenance => true)
        expect(helper).to receive(:disable_authority_badge?).never
        expect(helper.show_provenance_badge_in_old_catalog?(View.new)).to be_truthy
        stub_feature_flags_with(:enable_data_lens_provenance => false)
        expect(helper.show_provenance_badge_in_old_catalog?(View.new)).to be_falsey
      end

    end

  end

  describe 'show_official_badge_in_catalog?' do
    let(:show_provenance_badge_in_catalog) { true }

    before do
      stub_feature_flags_with(:show_provenance_badge_in_catalog => show_provenance_badge_in_catalog)
    end

    context 'when show_provenance_badge_in_catalog feature flag is true' do

      it 'should return true when the view is official' do
        allow_any_instance_of(View).to receive(:is_official?).and_return(true)
        expect(helper.show_official_badge_in_catalog?(View.new)).to be_truthy
      end

      it 'should return false when the view is not official' do
        allow_any_instance_of(View).to receive(:is_official?).and_return(false)
        expect(helper.show_official_badge_in_catalog?(View.new)).to be_falsey
      end

    end

    context 'when show_provenance_badge_in_catalog feature flag is false' do
      let(:show_provenance_badge_in_catalog) { false }

      it 'should return false when the view is official' do
        allow_any_instance_of(View).to receive(:is_official?).and_return(true)
        expect(helper.show_official_badge_in_catalog?(View.new)).to be_falsey
      end

      it 'should return false when the view is not official' do
        allow_any_instance_of(View).to receive(:is_official?).and_return(false)
        expect(helper.show_official_badge_in_catalog?(View.new)).to be_falsey
      end

    end

  end

  describe 'show_community_badge_in_catalog?' do
    let(:show_provenance_badge_in_catalog) { true }

    before do
      stub_feature_flags_with(:show_provenance_badge_in_catalog => show_provenance_badge_in_catalog)
    end

    context 'when show_provenance_badge_in_catalog feature flag is true' do

      it 'should return true when the view is community' do
        allow_any_instance_of(View).to receive(:is_community?).and_return(true)
        expect(helper.show_community_badge_in_catalog?(View.new)).to be_truthy
      end

      it 'should return false when the view is not community' do
        allow_any_instance_of(View).to receive(:is_community?).and_return(false)
        expect(helper.show_community_badge_in_catalog?(View.new)).to be_falsey
      end

    end

    context 'when show_provenance_badge_in_catalog feature flag is false' do
      let(:show_provenance_badge_in_catalog) { false }

      it 'should return false when the view is community' do
        allow_any_instance_of(View).to receive(:is_community?).and_return(true)
        expect(helper.show_community_badge_in_catalog?(View.new)).to be_falsey
      end

      it 'should return false when the view is not community' do
        allow_any_instance_of(View).to receive(:is_community?).and_return(false)
        expect(helper.show_community_badge_in_catalog?(View.new)).to be_falsey
      end

    end

  end

end
