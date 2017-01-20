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

  describe '#getty_images_enabled?' do
    it 'returns the value of the corresponding feature flag' do
      set_feature_flags('enable_getty_images_gallery' => true)
      expect(helper.getty_images_enabled?).to eq(true)

      set_feature_flags('enable_getty_images_gallery' => false)
      expect(helper.getty_images_enabled?).to eq(false)
    end
  end

  describe '#deprecated_user_search_api_enabled?' do
    it 'returns the value of the corresponding feature flag' do
      set_feature_flags('enable_deprecated_user_search_api' => true)
      expect(helper.deprecated_user_search_api_enabled?).to eq(true)

      set_feature_flags('enable_deprecated_user_search_api' => false)
      expect(helper.deprecated_user_search_api_enabled?).to eq(false)
    end
  end

  describe '#filtered_tables_in_ax_enabled?' do
    it 'returns the value of the corresponding feature flag' do
      set_feature_flags('enable_filtered_tables_in_ax' => true)
      expect(helper.filtered_tables_in_ax_enabled?).to eq(true)

      set_feature_flags('enable_filtered_tables_in_ax' => false)
      expect(helper.filtered_tables_in_ax_enabled?).to eq(false)
    end
  end

  describe '#filterable_visualizations_in_ax_enabled?' do
    it 'returns the value of the corresponding feature flag' do
      set_feature_flags('enable_filterable_visualizations_in_ax' => true)
      expect(helper.filterable_visualizations_in_ax_enabled?).to eq(true)

      set_feature_flags('enable_filterable_visualizations_in_ax' => false)
      expect(helper.filterable_visualizations_in_ax_enabled?).to eq(false)
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

  describe '#staging_lockdown_enabled?' do
    it 'returns true if the corresponding feature is enabled' do
      set_features
      expect(helper.staging_lockdown_enabled?).to eq(false)

      set_features(%w(staging_lockdown))
      expect(helper.staging_lockdown_enabled?).to eq(true)
    end
  end
end
