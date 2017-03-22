require 'rails_helper'

RSpec.describe FeaturesHelper, type: :helper do

  before(:each) do
    stub_current_domain # required for features, not feature flags
  end

  describe '#feature_flag_enabled?' do
    it 'returns the value of the corresponding feature flag' do
      set_feature_flags('enable_empathy' => true)
      expect(helper.feature_flag_enabled?('enable_empathy')).to eq(true)

      set_feature_flags('enable_empathy' => false)
      expect(helper.feature_flag_enabled?('enable_empathy')).to eq(false)
    end
  end

  describe '#feature_enabled?' do
    it 'returns a boolean indicating whether the given feature is enabled' do
      set_features(%w(staging_lockdown staging_api_lockdown))

      expect(helper.feature_enabled?('staging_lockdown')).to eq(true)
      expect(helper.feature_enabled?('govstat')).to eq(false)
    end
  end

  describe '#open_performance_enabled?' do
    it 'returns true if the corresponding feature is enabled' do
      set_features
      expect(helper.open_performance_enabled?).to eq(false)

      set_features(%w(govstat))
      expect(helper.open_performance_enabled?).to eq(true)
    end
  end

  describe '#render_admin_header?' do
    it 'returns false if feature flag and feature are off' do
      set_features
      set_feature_flags
      expect(helper.render_admin_header?).to eq(false)
    end

    it('returns true if feature flag is on') do
      set_features
      set_feature_flags('show_govstat_header' => true)
      expect(helper.render_admin_header?).to eq(true)
    end

    it('returns true if govstat feature is on') do
      set_features(%w(govstat))
      set_feature_flags
      expect(helper.render_admin_header?).to eq(true)
    end

    it('returns true if both govstat and feature flag are on') do
      set_features(%w(govstat))
      set_feature_flags('show_govstat_header' => true)
      expect(helper.render_admin_header?).to eq(true)
    end
  end

  describe '#staging_lockdown_enabled?' do
    it 'returns true if the corresponding feature is enabled' do
      set_features
      expect(helper.staging_lockdown_enabled?).to eq(false)

      set_features(%w(staging_lockdown))
      expect(helper.staging_lockdown_enabled?).to eq(true)
    end

    it 'returns false if the corresponding feature is enabled AND staging_lockdown_ignore_hosts includes the current domain' do
      allow(Rails.application.config).to receive(:staging_lockdown_ignore_hosts).and_return([helper.request.host])

      set_features
      expect(helper.staging_lockdown_enabled?).to eq(false)

      set_features(%w(staging_lockdown))
      expect(helper.staging_lockdown_enabled?).to eq(false)
    end

    it 'returns true if the corresponding feature is enabled AND staging_lockdown_ignore_hosts includes some other domain' do
      allow(Rails.application.config).to receive(:staging_lockdown_ignore_hosts).and_return(['example.com'])

      set_features
      expect(helper.staging_lockdown_enabled?).to eq(false)

      set_features(%w(staging_lockdown))
      expect(helper.staging_lockdown_enabled?).to eq(true)
    end
  end
end
