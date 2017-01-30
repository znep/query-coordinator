module FeaturesHelper
  def open_performance_enabled?
    feature_enabled?('govstat')
  end

  def render_admin_header?
    feature_enabled?('govstat') || feature_flag_enabled?('show_govstat_header')
  end

  def staging_lockdown_enabled?
    # Temporary workaround for EN-13486
    return false if Rails.application.config.staging_lockdown_ignore_hosts.include?(request.host)

    feature_enabled?('staging_lockdown')
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

  def feature_enabled?(name)
    SocrataSiteChrome::FeatureSet.new(CoreServer.current_domain['cname']).feature_enabled?(name) rescue false
  end
end
