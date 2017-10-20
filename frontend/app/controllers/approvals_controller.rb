class ApprovalsController < AdministrationController

  include ApplicationHelper
  include AssetBrowserHelper

  layout 'styleguide'

  def disable_site_chrome?
    true
  end

  def show
    @asset_browser_config = {
      :app_name => 'approvals',
      :columns => %w(type name actions lastUpdatedDate category owner visibility),
      :initial_tab => 'allAssets',
      :filters_enabled => true
    }
  end

  private

  def report_error(error_message)
    Airbrake.notify(
      :error_class => 'Approvals',
      :error_message => error_message
    )
    Rails.logger.error(error_message)
  end
end
