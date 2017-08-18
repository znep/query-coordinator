module Administration
  module RolesHelper

    def render_roles_server_config
      server_config = {
        :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
        :airbrakeKey => ENV['ADMIN_GOALS_PAGE_AIRBRAKE_API_KEY'] ||
          APP_CONFIG.admin_goals_page_airbrake_api_key,
        :airbrakeProjectId => ENV['ADMIN_GOALS_PAGE_AIRBRAKE_PROJECT_ID'] ||
          APP_CONFIG.admin_goals_page_airbrake_project_id,
        :csrfToken => form_authenticity_token.to_s,
        :currentUser => current_user,
        :domain => CurrentDomain.cname,
        :environment => Rails.env,
        :rolesAdminFaqUrl => ENV['ROLES_ADMIN_FAQ_URL'] || APP_CONFIG.roles_admin_faq_url,
        :featureFlags => feature_flags_as_json,
        :locale => I18n.locale.to_s,
        :localePrefix => locale_prefix,
        :maxCharacterCount => 35,
        :recaptchaKey => RECAPTCHA_2_SITE_KEY,
        :usersnapProjectID => 'b1f3034e-4a2c-4e96-8680-83ffea446194'
      }

      javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
    end
  end
end
