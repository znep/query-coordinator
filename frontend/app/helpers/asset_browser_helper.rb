module AssetBrowserHelper

  def asset_browser_translations
    translations = LocaleCache.render_translations([LocalePart.public_send(@app_name)])[@app_name]
    translations.deep_merge(common: LocaleCache.render_translations([LocalePart.common])['common'])
  end

  def render_asset_browser_translations
    old_translations = json_escape(asset_browser_translations.to_json)
    new_translations = json_escape(LocaleCache.render_partial_translations(@app_name.to_sym).to_json)
    javascript_tag("window.I18n = _.extend(I18n, #{old_translations}); window.translations = #{new_translations}")
  end

  def render_asset_browser_session_data
    session_data = {
      :userId => current_user.try(:id),
      :socrataEmployee => !!current_user.try(:is_superadmin?),
      :userRoleName => current_user.try(:roleName),
      :email => current_user.try(:email)
    }

    javascript_tag("window.sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_asset_browser_server_config
    feature_flags = FeatureFlags.derive(nil, request).slice(
      :disable_authority_badge,
      :enable_internal_asset_manager_my_assets,
      :stories_enabled
    )

    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      :airbrakeKey => ENV["#{@app_name.upcase}_AIRBRAKE_API_KEY"] ||
        APP_CONFIG.send("#{@app_name}_airbrake_api_key"),
      :airbrakeProjectId => ENV["#{@app_name.upcase}_AIRBRAKE_PROJECT_ID"] ||
        APP_CONFIG.send("#{@app_name}_airbrake_project_id"),
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :featureFlags => feature_flags,
      :locale => I18n.locale.to_s,
      :localePrefix => locale_prefix.to_s,
      :recaptchaKey => RECAPTCHA_2_SITE_KEY,
      :usersnapProjectID => '6afbcc90-6522-4475-b3b0-635c7a9874a5' # Specific to SIAM?
    }

    javascript_tag("window.serverConfig = #{json_escape(server_config.to_json)};")
  end

  # This method provides the initial redux store state for the asset browser using default values
  # along with domain-specific categories, custom facets, tags, and users fetched by the controller.
  # These are used to populate the filter dropdowns.
  def render_asset_browser_initial_state
    initial_state = {
      :assetInventoryViewModel => asset_inventory_view_model,
      :autocomplete => {
        query: params[:q].to_s
      },
      :catalog => {
        :columns => @asset_browser_columns
      },
      :domainCategories => @domain_categories,
      :domainCustomFacets => @domain_custom_facets,
      :domainTags => @domain_tags,
      :header => {
        :initialTab => @asset_browser_initial_tab
      },
      :usersList => @users_list
    }
    javascript_tag("window.initialState = #{json_escape(initial_state.to_json)}")
  end
end
