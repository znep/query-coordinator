module ApprovalsHelper

  def approvals_translations
    translations = LocaleCache.render_translations([LocalePart.approvals])['approvals']
    translations.deep_merge(
      common: LocaleCache.render_translations([LocalePart.common])['common']
    )
  end

  def render_approvals_translations
    translations = json_escape(LocaleCache.render_partial_translations(:approvals).to_json)
    javascript_tag("window.translations = #{translations}")
  end

  def render_approvals_session_data
    session_data = {
      :userId => current_user.try(:id),
      :socrataEmployee => !!current_user.try(:is_superadmin?),
      :userRoleName => current_user.try(:roleName),
      :email => current_user.try(:email)
    }

    javascript_tag("window.sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_approvals_server_config
    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      :airbrakeKey => ENV['APPROVALS_AIRBRAKE_API_KEY'] || APP_CONFIG.approvals_airbrake_api_key,
      :airbrakeProjectId => ENV['APPROVALS_AIRBRAKE_PROJECT_ID'] || APP_CONFIG.approvals_airbrake_project_id,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :featureFlags => {},
      :locale => I18n.locale.to_s,
      :localePrefix => locale_prefix.to_s,
      :recaptchaKey => RECAPTCHA_2_SITE_KEY
    }

    javascript_tag("window.serverConfig = #{json_escape(server_config.to_json)};")
  end

end
