module InternalAssetManagerHelper

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
      q: params[:q],
      show_visibility: true
    }.merge(initial_filter_cetera_opts).tap do |options|
      options.merge!(published: false, only: 'datasets') if params[:assetTypes] == 'workingCopies'
      options.merge!(published: true) if params[:assetTypes] == 'datasets'
      # EN-15849
      options.merge!(for_user: current_user.id) if current_tab_is_my_assets
      options.merge!(shared_to: current_user.id) if current_tab_is_shared_to_me
    end
  end

  def default_tab_for_siam
    current_user.has_right?(UserRights::CAN_SEE_ALL_ASSETS_TAB_SIAM) ? 'allAssets' : 'myAssets'
  end

  def current_tab_is_my_assets
    params.fetch(:tab, default_tab_for_siam) == 'myAssets'
  end

  def current_tab_is_shared_to_me
    params.fetch(:tab, default_tab_for_siam) == 'sharedToMe'
  end

end
