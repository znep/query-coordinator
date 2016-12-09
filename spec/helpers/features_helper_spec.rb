require 'rails_helper'

RSpec.describe FeaturesHelper, type: :helper do

  describe '#feature_flag_enabled?' do
    it 'returns the value of the corresponding feature flag' do
      set_feature_flags('enable_empathy' => true)
      expect(helper.feature_flag_enabled?('enable_empathy')).to eq(true)

      set_feature_flags('enable_empathy' => false)
      expect(helper.feature_flag_enabled?('enable_empathy')).to eq(false)
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

end
