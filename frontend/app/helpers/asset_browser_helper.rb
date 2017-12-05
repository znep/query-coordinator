module AssetBrowserHelper

  def app_name
    @asset_browser_config[:app_name]
  end

  def asset_browser_translations
    translations = LocaleCache.render_translations([LocalePart.public_send(app_name)])[app_name]
    translations.deep_merge(common: LocaleCache.render_translations([LocalePart.common])['common'])
  end

  def render_asset_browser_translations
    old_translations = json_escape(asset_browser_translations.to_json)
    new_translations = json_escape(LocaleCache.render_partial_translations(app_name.to_sym).to_json)
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
      :stories_enabled,
      :usaid_features_enabled
    )

    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      :airbrakeKey => ENV["#{app_name.upcase}_AIRBRAKE_API_KEY"] ||
        APP_CONFIG.send("#{app_name}_airbrake_api_key"),
      :airbrakeProjectId => ENV["#{app_name.upcase}_AIRBRAKE_PROJECT_ID"] ||
        APP_CONFIG.send("#{app_name}_airbrake_project_id"),
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

  # This method provides the initial redux store state for the static data used by asset browser
  # including domain-specific categories, custom facets, tags, users, initial tab, columns in the table...
  def render_asset_browser_initial_state(supplemental_state = {})
    initial_state = {
      :assetInventoryViewModel => asset_inventory_view_model,
      :autocomplete => {
        query: params[:q].to_s
      },
      :catalog => {
        :columns => @asset_browser_config[:columns]
      },
      :header => {
        :initialTab => @asset_browser_config[:initial_tab]
      },
      :targetUserId => @asset_browser_config[:target_user_id]
    }.compact

    # The following fetches are used to populate the values in the filter dropdowns.
    initial_state.merge!(
      :domainCategories => fetch_domain_categories,
      :domainCustomFacets => fetch_domain_custom_facets,
      :domainTags => fetch_domain_tags,
      :usersList => fetch_users_list
    ) if @asset_browser_config[:filters_enabled]

    initial_state.merge!(supplemental_state.to_h)

    # TODO: rename this to window.socrata.assetBrowser.staticData
    javascript_tag(
      <<~EOM
        window.socrata = window.socrata || {};
        window.socrata.initialState = #{json_escape(initial_state.to_json)}
      EOM
    )
  end

  # Cetera fetches to populate AssetBrowser filter dropdowns
  def fetch_users_list
    begin
      dataset_owners = Cetera::Utils.user_search_client.find_all_owners(
        request_id,
        forwardable_session_cookies
      )
      Cetera::Results::UserSearchResult.new(dataset_owners).results
    rescue => e
      report_error("Error fetching Cetera user results: #{e.inspect}")
      []
    end.sort_by(&:sort_key)
  end

  def fetch_domain_categories
    begin
      Cetera::Utils.facet_search_client.get_categories_of_views(
        request_id, forwardable_session_cookies, domains: CurrentDomain.cname
      ).to_h['results'].to_a.pluck('domain_category').reject(&:empty?)
    rescue => e
      report_error("Error fetching Cetera domain categories: #{e.inspect}")
      []
    end
  end

  def fetch_domain_tags
    begin
      Cetera::Utils.facet_search_client.get_tags_of_views(
        request_id, forwardable_session_cookies, domains: CurrentDomain.cname
      ).to_h['results'].to_a.pluck('domain_tag').reject(&:empty?)
    rescue => e
      report_error("Error fetching Cetera domain tags: #{e.inspect}")
      []
    end
  end

  def fetch_domain_custom_facets
    begin
      CurrentDomain.property(:custom_facets, :catalog) # Array of Hashie::Mash
    rescue => e
      report_error("Error fetching custom facets: #{e.inspect}")
      []
    end
  end

  def report_error(error_message)
    Airbrake.notify(
      :error_class => app_name,
      :error_message => error_message
    )
    Rails.logger.error(error_message)
  end
end
