module ThirdPartySurvey
  def render_qualtrics_survey(config_key)
    survey_id = APP_CONFIG.qualtrics.fetch(config_key, {}).fetch('survey_id', nil)
    if survey_id.present? && survey_feature_flag_enabled?('qualtrics') && current_domain.member?(current_user)
      render :partial => partial_path('qualtrics'), :locals => { :qualtrics_survey_id => survey_id }
    end
  end

  def render_userzoom_survey(config_key)
    config = APP_CONFIG.userzoom.fetch(config_key, {})
    cuid = APP_CONFIG.userzoom.fetch('cuid', nil)
    id = config.fetch('id', nil)
    sid = config.fetch('sid', nil)
    return if [cuid, id, sid].any?(&:blank?)
    if survey_feature_flag_enabled?('userzoom') && current_domain.member?(current_user)
      render :partial => partial_path('userzoom'), :locals => {
        :userzoom_cuid => cuid,
        :userzoom_id => id,
        :userzoom_sid => sid
      }
    end
  end

  private

  def survey_feature_flag_enabled?(service_name)
    FeatureFlags.derive.send("enable_third_party_survey_#{service_name}".to_sym)
  end

  def partial_path(service_name)
    "templates/third_party_survey_scripts/#{service_name}"
  end
end
