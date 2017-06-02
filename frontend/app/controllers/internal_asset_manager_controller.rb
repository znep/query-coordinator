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
