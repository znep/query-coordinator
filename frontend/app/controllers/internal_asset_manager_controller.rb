class InternalAssetManagerController < ApplicationController

  include ApplicationHelper
  include InternalAssetManagerHelper

  # NOTE: This should match the value of RESULTS_PER_PAGE in
  # public/javascripts/internalAssetManager/components/CatalogResults.js and
  # public/javascripts/internalAssetManager/actions/cetera.js
  RESULTS_PER_PAGE = 10

  before_filter :require_roled_user

  layout 'styleguide'

  def disable_site_chrome?
    true
  end

  def show
    cookie = "_core_session_id=#{cookies[:_core_session_id]}"

    # These populate the corresponding values in the filter dropdowns
    @users_list = fetch_users
    @domain_categories = fetch_domain_categories
    @domain_tags = fetch_domain_tags
    # Note: @domain_custom_facets needs to be set before @initial_filters and @catalog_results
    @domain_custom_facets = fetch_domain_custom_facets

    @initial_filters = initial_filters
    @initial_order = {
      value: query_param_value('orderColumn'),
      ascending: query_param_value('orderDirection').to_s.downcase == 'asc'
    }
    @initial_page = query_param_value('page').to_i

    catalog_results_response = begin
      AssetInventoryService::InternalAssetManager.find(request_id, cookie, siam_search_options).to_h
    rescue => e
      report_error("Error fetching Cetera results: #{e.inspect}")
      { 'results' => [], 'resultSetSize' => 0 }
    end

    @catalog_results = catalog_results_response['results'].to_a
    @catalog_result_set_size = catalog_results_response['resultSetSize'].to_i

    if params[:assetTypes].present?
      asset_types = [params[:assetTypes]]
    else
      # Note: these asset_types should match those listed in the `asset_counts` component and reducer
      asset_types = %w(charts datalenses,visualizations datasets files filters hrefs maps stories)
    end

    @asset_counts = begin
      Cetera::Utils.get_asset_counts(asset_types, request_id, forwardable_session_cookies, siam_search_options)
    rescue => e
      report_error("Error fetching Cetera asset counts: #{e.inspect}")
      {}
    end
  end

  private

  def require_roled_user
    user = current_user || User.new
    render_forbidden(I18n.t('core.auth.need_permission')) unless user.is_superadmin? || user.is_roled_user?
  end

  def fetch_users
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
      :error_class => 'InternalAssetManager',
      :error_message => error_message
    )
    Rails.logger.error(error_message)
  end
end
