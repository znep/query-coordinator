# The preferred usage for checking on features is to create a convenience method
# here that checks for the presence of the feature through feature flags and/or
# account features/modules.
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

  def mixpanel_tracking_enabled?
    Rails.application.config.mixpanel_token.present? &&
      feature_flag_enabled?('enable_storyteller_mixpanel') &&
      (mixpanel_tracking_feature_enabled? || full_mixpanel_tracking_feature_enabled?)
  end

  def mixpanel_tracking_feature_enabled?
    feature_enabled?('mixpaneltracking')
  end

  def full_mixpanel_tracking_feature_enabled?
    feature_enabled?('fullmixpaneltracking')
  end

  def pendo_tracking_enabled?
    Rails.application.config.pendo_token.present? &&
      feature_enabled?('pendo_tracking')
  end

  private

  def feature_flag_enabled?(flag)
    case Rails.application.config.feature_flag_service
    when :signaller then Signaller.for(flag: flag).value(on_domain: request.host)
    when :monitor then FeatureFlagMonitor.flag(name: flag, on_domain: request.host)
    end
  end

  def feature_enabled?(name)
    feature_set.feature_enabled?(name) rescue false
  end

  def feature_set
    @feature_set ||= SocrataSiteChrome::FeatureSet.new(CoreServer.current_domain['cname'])
  end
end
