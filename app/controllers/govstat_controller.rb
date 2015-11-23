class GovstatController < ApplicationController
  include ActionView::Helpers::AssetTagHelper
  include Jammit::Helper
  include CustomContentHelper
  include BrowseActions

  before_filter :check_govstat_enabled
  before_filter :check_domain_member

  def manage_reports
    @own_reports, @other_reports = get_reports
  end

  def manage_config
  end

  protected
  def check_govstat_enabled
    if CurrentDomain.module_enabled?(:govStat)
      return true
    else
      render_404
      return false
    end
  end

  def check_domain_member
    if CurrentDomain.member?(current_user)
      return true
    else
      return render_403
    end
  end

  def get_reports
    # So report names can be localized
    Canvas2::Util.set_env({
      domain: CurrentDomain.cname,
      renderTime: Time.now.to_i,
      siteTheme: CurrentDomain.theme,
      currentUser: current_user ? current_user.id : nil,
      current_locale: I18n.locale,
      available_locales: request.env['socrata.available_locales']
    })

    begin
      reports = Page.find('$order' => ':updated_at desc', 'status' => 'all',
        '$select' => 'name,path,content,metadata,owner,:updated_at')
    rescue Exception => e
      # In case Pages doesn't have the owner column, fall-back to the safe items
      reports = Page.find('$order' => ':updated_at desc', 'status' => 'all',
        '$select' => 'name,path,content,metadata,:updated_at')
    end
    # HACK
    reports.select! { |r| r.path.start_with?('/reports/') }
    own_reports = []
    other_reports = []
    reports.each do |r|
      next if r.format == 'export' || r.path.include?('/:')
      if r.owner_id == current_user.id
        own_reports.push(r)
      else
        other_reports.push(r)
      end
    end
    return own_reports, other_reports
  end

  private
  # make jammit happy
  def controller
    self
  end
end
