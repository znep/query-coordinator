module Userzoom
  def render_userzoom_survey(config_key)
    config = APP_CONFIG.userzoom.fetch(config_key, {})
    cuid = APP_CONFIG.userzoom.fetch('cuid', nil)
    id = config.fetch('id', nil)
    sid = config.fetch('sid', nil)
    if cuid.present? && id.present? && sid.present? && current_domain.member?(current_user)
      render :partial => 'templates/userzoom_survey_script', :locals => {
        :userzoom_cuid => cuid,
        :userzoom_id => id,
        :userzoom_sid => sid
      }
    end
  end
end
