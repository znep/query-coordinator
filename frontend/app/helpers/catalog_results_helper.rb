module CatalogResultsHelper

  def catalog_results_translations
    translations = LocaleCache.
      render_translations([LocalePart.internal_asset_manager])['internal_asset_manager']
    translations.deep_merge(
      common: LocaleCache.render_translations([LocalePart.common])['common']
    )
  end

  def render_catalog_results_translations
    old_translations = json_escape(catalog_results_translations.to_json)
    new_translations = json_escape(LocaleCache.render_partial_translations(:internal_asset_manager).to_json)
    javascript_tag("window.I18n = _.extend(I18n, #{old_translations}); window.translations = #{new_translations}")
  end

  def render_catalog_results_session_data
    session_data = {
      :userId => current_user.try(:id),
      :socrataEmployee => !!current_user.try(:is_superadmin?),
      :userRoleName => current_user.try(:roleName),
      :email => current_user.try(:email)
    }

    javascript_tag("window.sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_catalog_results_server_config
    feature_flags = FeatureFlags.derive(nil, request).slice(
      :disable_authority_badge,
      :enable_internal_asset_manager_my_assets,
      :stories_enabled
    )

    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      :airbrakeKey => ENV['INTERNAL_ASSET_MANAGER_AIRBRAKE_API_KEY'] ||
        APP_CONFIG.internal_asset_manager_airbrake_api_key,
      :airbrakeProjectId => ENV['INTERNAL_ASSET_MANAGER_AIRBRAKE_PROJECT_ID'] ||
        APP_CONFIG.internal_asset_manager_airbrake_project_id,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :featureFlags => feature_flags,
      :locale => I18n.locale.to_s,
      :localePrefix => locale_prefix.to_s,
      :recaptchaKey => RECAPTCHA_2_SITE_KEY,
      :usersnapProjectID => '6afbcc90-6522-4475-b3b0-635c7a9874a5'
    }

    javascript_tag("window.serverConfig = #{json_escape(server_config.to_json)};")
  end

  # This method provides the initial redux store state for the internal asset manager using default values
  # along with any filters, search terms, etc. on the URL. After the page has loaded, the Redux store is the
  # source of truth and any changes to it will be reflected in the URL.
  def render_catalog_results_initial_state
    initial_state = {
      :assetCounts => {
        :values => @asset_counts
      },
      :assetInventoryViewModel => asset_inventory_view_model,
      :autocomplete => {
        query: params[:q].to_s
      },
      :catalog => {
        :columns => catalog_results_table_columns,
        :results => @catalog_results,
        :resultSetSize => @catalog_result_set_size
      },
      :domainCategories => @domain_categories,
      :domainCustomFacets => @domain_custom_facets,
      :domainTags => @domain_tags,
      :initialFilters => @initial_filters,
      :initialOrder => @initial_order,
      :initialPage => @initial_page,
      :q => params[:q].to_s,
      :usersList => @users_list
    }
    javascript_tag("window.initialState = #{json_escape(initial_state.to_json)}")
  end

  # Defines the default order of the columns for the internal asset manager table.
  # Eventually this will be configurable on a per-user basis.
  def catalog_results_table_columns
    %w(type name actions lastUpdatedDate category owner visibility)
  end

end
