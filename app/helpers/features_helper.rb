module FeaturesHelper
  def open_performance_enabled?
    SocrataSiteChrome::FeatureSet.new(current_domain['cname']).feature_enabled?('govstat') rescue false
  end

  def getty_images_enabled?
    feature_flag_enabled?('enable_getty_images_gallery')
  end

  def deprecated_user_search_api_enabled?
    feature_flag_enabled?('enable_deprecated_user_search_api')
  end

  def filtered_tables_in_ax_enabled?
    feature_flag_enabled?('enable_filtered_tables_in_ax')
  end

  def filterable_visualizations_in_ax_enabled?
    feature_flag_enabled?('enable_filterable_visualizations_in_ax')
  end

  def feature_flag_enabled?(flag)
    Signaller.for(flag: flag).value(on_domain: request.host)
  end
end
