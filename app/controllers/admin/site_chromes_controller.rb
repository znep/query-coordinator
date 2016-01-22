class Admin::SiteChromesController < ApplicationController
  prepend_before_filter :require_super_admin

  layout 'admin'

  def edit
    @site_chrome = SiteChrome.for_current_domain
  end

  def update
    @site_chrome = SiteChrome.for_current_domain
    if @site_chrome.update_attributes(site_chrome_params)
      flash[:success] = 'Successfully updated site chrome config'
      redirect_to action: 'edit'
    else
      flash.now[:error] = @site_chrome.errors.full_messages.to_sentence
      render 'edit'
    end
  end

  private

  def site_chrome_params
    params.require(:site_chrome).permit(
      :styles => [ '$bg-color', '$font-color' ],
      :content => [
        'logoUrl', 'logoAltText', 'friendlySiteName',
        'link1Label', 'link1Url', 'link2Label', 'link2Url', 'link3Label', 'link3Url',
        'footerText'
      ]
    ).tap do |whitelisted|
      whitelisted['domain_cname'] = request.host
    end
  end

end
