module CatalogLandingPageHelper

  def catalog_landing_page_translations
    translations = LocaleCache.render_translations([LocalePart.catalog_landing_page])['catalog_landing_page']
    translations.deep_merge(
      common: LocaleCache.render_translations([LocalePart.common])['common']
    )
  end

  def render_catalog_landing_page_translations
    javascript_tag("var I18n = _.extend(I18n, #{json_escape(catalog_landing_page_translations.to_json)});")
  end

  def render_catalog_landing_page_mixpanel_config
    mixpanel_config = { :token => APP_CONFIG.mixpanel_token }

    if CurrentDomain.feature?(:mixpanelTracking)
      mixpanel_config[:options] = { :cookie_expiration => nil }
    elsif CurrentDomain.feature?(:fullMixpanelTracking)
      mixpanel_config[:options] = { :cookie_expiration => 365 }
    else
      mixpanel_config[:disable] = true
    end

    javascript_tag("var mixpanelConfig = #{json_escape(mixpanel_config.to_json)};")
  end

  def render_catalog_landing_page_session_data
    session_data = {
      :userId => current_user.try(:id) || 'N/A',
      :socrataEmployee => current_user.try(:is_admin?) || false,
      :userRoleName => current_user.try(:roleName) || 'N/A',
      :email => current_user.try(:email).to_s
    }

    javascript_tag("var sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_catalog_landing_page_server_config
    # Figure out if we need a locale prefix on links
    locale_prefix = (I18n.locale.to_sym == CurrentDomain.default_locale.to_sym) ? '' : "/#{I18n.locale}"

    feature_flags = FeatureFlags.derive(nil, request).slice(
      :enable_catalog_landing_page,
      :default_to_catalog_landing_page,
      :stories_enabled
    ).camelize_keys!

    server_config = {
      :airbrakeKey => ENV['CATEGORY_LANDING_PAGE_AIRBRAKE_API_KEY'] ||
        APP_CONFIG.catalog_landing_page_airbrake_api_key,
      :airbrakeProjectId => ENV['CATEGORY_LANDING_PAGE_AIRBRAKE_PROJECT_ID'] ||
        APP_CONFIG.catalog_landing_page_airbrake_project_id,
      :ceteraExternalUri => APP_CONFIG.cetera_external_uri,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
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
        search: '',
        header: #{@header.to_json},
        categoryStats: #{@category_stats.to_json},
        featuredContent: #{@featured_content.to_a.to_json}
      };
    ))
  end

end
