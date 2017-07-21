module CatalogLandingPageHelper

  def catalog_landing_page_translations
    translations = LocaleCache.render_translations([LocalePart.catalog_landing_page])['catalog_landing_page']
    translations.deep_merge(
      common: LocaleCache.render_translations([LocalePart.common])['common']
    )
  end

  def render_catalog_landing_page_translations
    old_translations = json_escape(catalog_landing_page_translations.to_json)
    new_translations = json_escape(LocaleCache.render_partial_translations(:catalog_landing_page).to_json)
    javascript_tag("var I18n = _.extend(I18n, #{old_translations}); var translations = #{new_translations}")
  end

  def render_catalog_landing_page_session_data
    session_data = {
      :userId => current_user.try(:id) || 'N/A',
      :socrataEmployee => current_user.try(:is_superadmin?) || false,
      :userRoleName => current_user.try(:roleName) || 'N/A',
      :email => current_user.try(:email).to_s
    }

    javascript_tag("var sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_catalog_landing_page_server_config
    # Figure out if we need a locale prefix on links
    feature_flags = FeatureFlags.derive(nil, request).slice(
      :browse_autocomplete,
      :clp_move_description_below_featured_content,
      :default_to_catalog_landing_page,
      :enable_catalog_landing_page,
      :enable_markdown_for_catalog_landing_page_description,
      :stories_enabled
    )

    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      :airbrakeKey => ENV['CATALOG_LANDING_PAGE_AIRBRAKE_API_KEY'] ||
        APP_CONFIG.catalog_landing_page_airbrake_api_key,
      :airbrakeProjectId => ENV['CATALOG_LANDING_PAGE_AIRBRAKE_PROJECT_ID'] ||
        APP_CONFIG.catalog_landing_page_airbrake_project_id,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :currentUserMayManage => can_manage_catalog_landing_page?,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :featureFlags => feature_flags,
      :locale => I18n.locale.to_s,
      :localePrefix => locale_prefix.to_s,
      :recaptchaKey => RECAPTCHA_2_SITE_KEY
    }

    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
  end

  def render_catalog_landing_page_initial_state
    javascript_tag(%Q(
      var initialState = {
        catalog: {
          query: #{@catalog_landing_page.to_query.to_json},
          path: #{@catalog_landing_page.to_uri.to_s.to_json}
        },
        featuredContent: #{@featured_content.to_json},
        header: #{@metadata.camelize_keys.to_json},
        search: ''
      };
    ))
  end

  def should_render_catalog_landing_page_activator?
    FeatureFlags.value_for(:enable_catalog_landing_page, request: request) &&
      CatalogLandingPage.may_activate?(request) &&
      can_manage_catalog_landing_page? && (
        @catalog_landing_page.blank? ||
        (@catalog_landing_page.present? && @catalog_landing_page.metadata.values.all?(&:blank?))
      )
  end

  def can_manage_catalog_landing_page?
    current_user.try(:is_any?, :publisher, :administrator, :superadmin)
  end

end
