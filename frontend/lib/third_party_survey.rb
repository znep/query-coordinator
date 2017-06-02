module ThirdPartySurvey
  def render_qualtrics_survey(config_key)
    survey_id = APP_CONFIG.qualtrics.fetch(config_key, {}).fetch('survey_id', nil)
    if survey_id.present? && survey_feature_flag_enabled?('qualtrics') && current_domain.member?(current_user)
      render :partial => partial_path('qualtrics'), :locals => { :qualtrics_survey_id => survey_id }
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
