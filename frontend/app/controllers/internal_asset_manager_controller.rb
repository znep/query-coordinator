class InternalAssetManagerController < ApplicationController

  include ApplicationHelper
  include InternalAssetManagerHelper

  before_action :require_administrator

  layout 'styleguide'

  def show
    cookie = "_core_session_id=#{cookies[:_core_session_id]}"
    search_options = {
      domains: CurrentDomain.cname,
      limit: 10,
      show_visibility: true
    }
    @catalog_results = AssetInventoryService::InternalAssetManager.
      find(request_id, cookie, search_options).dig('results')
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
