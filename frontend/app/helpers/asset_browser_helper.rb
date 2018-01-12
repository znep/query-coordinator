module AssetBrowserHelper

  def asset_browser_config
    @asset_browser_config.to_h
  end

  def app_name
    asset_browser_config[:app_name] || 'internal_asset_manager'
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

    approval_workflow = Fontana::Approval::Workflow.find
    approval_settings = {
      :official => approval_workflow.steps.first.official_task.manual? ? 'manual' : 'automatic',
      :community => approval_workflow.steps.first.community_task.manual? ? 'manual' : 'automatic'
    }
    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      :airbrakeKey => ENV["#{app_name.upcase}_AIRBRAKE_API_KEY"] ||
        APP_CONFIG.send("#{app_name}_airbrake_api_key"),
      :airbrakeProjectId => ENV["#{app_name.upcase}_AIRBRAKE_PROJECT_ID"] ||
        APP_CONFIG.send("#{app_name}_airbrake_project_id"),
      :approvalSettings => approval_settings,
      :csrfToken => form_authenticity_token.to_s,
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
  # including domain-specific categories, custom facets, tags, and users.
  def render_asset_browser_initial_state(supplemental_state = {})
    initial_state = {
      :assetInventoryViewModel => asset_inventory_view_model
    }.compact

    # The following fetches are used to populate the values in the filter dropdowns.
    initial_state.merge!(
      :domainCategories => fetch_domain_categories,
      :domainCustomFacets => fetch_domain_custom_facets,
      :domainTags => fetch_domain_tags,
      :usersList => fetch_users_list
    ) if asset_browser_config[:filters_enabled]

    initial_state.merge!(supplemental_state.to_h)

    autocomplete_initial_state = {
      query: params[:q].to_s
    }

    javascript_tag(
      <<~EOM
        window.socrata = window.socrata || {};
        window.socrata.assetBrowser = window.socrata.assetBrowser || {};
        window.socrata.assetBrowser.staticData = #{json_escape(initial_state.to_json)}

        window.initialState = window.initialState || {};
        window.initialState.autocomplete = #{json_escape(autocomplete_initial_state.to_json)}
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
