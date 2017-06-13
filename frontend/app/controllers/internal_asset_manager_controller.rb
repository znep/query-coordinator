class InternalAssetManagerController < ApplicationController

  include ApplicationHelper
  include InternalAssetManagerHelper

  before_action :require_administrator

  layout 'styleguide'

  def disable_site_chrome?
    true
  end

  def show
    cookie = "_core_session_id=#{cookies[:_core_session_id]}"
    search_options = {
      domains: CurrentDomain.cname,
      limit: 10, # NOTE: This should match the value of RESULTS_PER_PAGE in
                 # public/javascripts/internalAssetManager/components/CatalogResults.js
      show_visibility: true
    }
    cetera_response = AssetInventoryService::InternalAssetManager.find(request_id, cookie, search_options)
    @catalog_results = cetera_response.to_h['results'].to_a
    @catalog_result_set_size = cetera_response.to_h['resultSetSize'].to_i

    cetera_user_search_client = Cetera::Utils.user_search_client
    roled_users = cetera_user_search_client.find_all_with_roles(request_id, forwardable_session_cookies)
    user_results = Cetera::Results::UserSearchResult.new(roled_users).results
    @users_list = user_results.sort_by(&:sort_key)

    cetera_facet_search_client = Cetera::Utils.facet_search_client

    @domain_categories = cetera_facet_search_client.get_categories_of_views(
      request_id, forwardable_session_cookies, domains: CurrentDomain.cname
    ).to_h['results'].to_a.pluck('domain_category').reject(&:empty?)

    @domain_tags = cetera_facet_search_client.get_tags_of_views(
      request_id, forwardable_session_cookies, domains: CurrentDomain.cname
    ).to_h['results'].to_a.pluck('domain_tag').reject(&:empty?)

    # Note: asset_types should match those listed in the `asset_counts` component and reducer
    asset_types = %w(datasets charts maps stories)
    @asset_counts = Cetera::Utils.get_asset_counts(asset_types, request_id, forwardable_session_cookies)
  end

  private

  def require_administrator
    return require_user(true) unless current_user.present?

    unless current_user.try(:is_any?, :administrator, :superadmin)
      flash.now[:error] = I18n.t('internal_asset_manager.errors.insufficent_view_permission')
      render 'shared/error', :status => :forbidden
    end
  end
end
