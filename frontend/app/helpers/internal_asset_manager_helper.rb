module InternalAssetManagerHelper

  def internal_asset_manager_translations
    translations = LocaleCache.
      render_translations([LocalePart.internal_asset_manager])['internal_asset_manager']
    translations.deep_merge(
      common: LocaleCache.render_translations([LocalePart.common])['common']
    )
  end

  def render_internal_asset_manager_translations
    old_translations = json_escape(internal_asset_manager_translations.to_json)
    new_translations = json_escape(LocaleCache.render_partial_translations(:internal_asset_manager).to_json)
    javascript_tag("window.I18n = _.extend(I18n, #{old_translations}); window.translations = #{new_translations}")
  end

  def render_internal_asset_manager_session_data
    session_data = {
      :userId => current_user.try(:id),
      :socrataEmployee => !!current_user.try(:is_superadmin?),
      :userRoleName => current_user.try(:roleName),
      :email => current_user.try(:email)
    }

    javascript_tag("window.sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_internal_asset_manager_server_config
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
  def render_internal_asset_manager_initial_state
    initial_state = {
      :assetCounts => {
        :values => @asset_counts
      },
      :assetInventoryViewModel => asset_inventory_view_model,
      :autocomplete => {
        query: params[:q].to_s
      },
      :catalog => {
        :columns => internal_asset_manager_table_columns,
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
  def internal_asset_manager_table_columns
    %w(type name actions lastUpdatedDate category owner visibility)
  end

  def query_param_value(query_param_name)
    request.query_parameters[query_param_name]
  end

  # Parse filters from url params
  def initial_filters
    request.query_parameters.slice(
      :assetTypes, :authority, :category, :q, :tab, :tag, :visibility
    ).merge(
      ownedBy: {
        displayName: query_param_value('ownerName'),
        id: query_param_value('ownerId')
      }
    ).merge(:customFacets => custom_facet_filters).delete_if { |k, v| v.blank? }
  end

  def initial_cetera_order
    return unless query_param_value('orderColumn').present? && query_param_value('orderDirection').present?

    column = query_param_value('orderColumn')
    direction = query_param_value('orderDirection').to_s.upcase

    case column
    when 'category'
      "domain_category #{direction}"
    when 'lastUpdatedDate'
      "updatedAt #{direction}"
    when 'type'
      "datatype #{direction}"
    else
      "#{column} #{direction}"
    end
  end

  def page_number_to_offset(page)
    (page.to_i - 1) * InternalAssetManagerController::RESULTS_PER_PAGE if page.present? && page.to_i > 1
  end

  # Map url param filters for "catalog results" and "asset counts" cetera requests.
  def initial_filter_cetera_opts
    {
      categories: query_param_value('category'),
      for_user: query_param_value('ownerId'),
      only: query_param_value('assetTypes'),
      order: initial_cetera_order,
      offset: page_number_to_offset(query_param_value('page')),
      provenance: query_param_value('authority'),
      q: query_param_value('q'),
      tags: query_param_value('tag'),
      visibility: query_param_value('visibility')
    }.merge(custom_facet_filters).delete_if { |k, v| v.blank? }
  end

  def custom_facet_filters
    @domain_custom_facets.to_a.map do |facet|
      { facet.param => query_param_value(facet.param) }
    end.reduce({}, :merge)
  end

  def siam_search_options
    # Note, changes to filters and search options in this method must match the corresponding implementation
    # in platform-ui/frontend/public/javascripts/common/cetera_utils.js
    {
      domains: CurrentDomain.cname,
      limit: InternalAssetManagerController::RESULTS_PER_PAGE,
      order: 'updatedAt DESC',
      published: 'true',
      q: params[:q],
      show_visibility: true
    }.merge(initial_filter_cetera_opts).tap do |options|
      options.merge!(published: false, only: 'datasets') if params[:assetTypes] == 'workingCopies'
      options.merge!(published: true) if params[:assetTypes] == 'datasets'
      # EN-15849
      options.merge!(for_user: current_user.id) if feature_flag?(:enable_internal_asset_manager_my_assets, request)
    end
  end

end
