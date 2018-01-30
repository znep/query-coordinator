class Administration::InternalAssetManagerController < ApplicationController

  include ApplicationHelper
  include AssetBrowserHelper

  before_filter :require_roled_user

  layout 'administration'

  def disable_site_chrome?
    true
  end

  def show
    @asset_browser_config = {
      :app_name => 'internal_asset_manager',
      :filters_enabled => true
    }
  end

  private

  def require_roled_user
    user = current_user || User.new
    render_forbidden(I18n.t('core.auth.need_permission')) unless user.is_superadmin? || user.is_roled_user?
  end
end
