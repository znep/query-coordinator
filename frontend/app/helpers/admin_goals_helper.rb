module AdminGoalsHelper
  def render_admin_goals_session_data
    session_data = {
      :userId => current_user.try(:id) || 'N/A',
      :socrataEmployee => current_user.try(:is_superadmin?) || false,
      :userRoleName => current_user.try(:roleName) || 'N/A',
      :email => current_user.try(:email).to_s
    }

    javascript_tag("var sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_admin_goals_server_config
    server_config = {
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :featureFlags => feature_flags_as_json,
      :locale => I18n.locale.to_s,
      :localePrefix => (I18n.locale.to_sym == CurrentDomain.default_locale.to_sym) ? '' : "/#{I18n.locale}",
      :recaptchaKey => RECAPTCHA_2_SITE_KEY,
      :usersnapProjectID => 'b1f3034e-4a2c-4e96-8680-83ffea446194'
    }

    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
  end
end
