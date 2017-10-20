class InternalAssetManagerController < ApplicationController

  include ApplicationHelper
  include AssetBrowserHelper

  before_filter :require_roled_user

  layout 'styleguide'

  def disable_site_chrome?
    true
  end

  def show
    @asset_browser_config = {
      :app_name => 'internal_asset_manager',
      :columns => %w(type name actions lastUpdatedDate category owner visibility),
      :initial_tab => current_user.has_right?('can_see_all_assets_tab_siam') ? 'allAssets' : 'myAssets',
      :filters_enabled => true
    }
  end

  private

  def require_roled_user
    user = current_user || User.new
    render_forbidden(I18n.t('core.auth.need_permission')) unless user.is_superadmin? || user.is_roled_user?
  end
end
