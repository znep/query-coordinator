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
        'logo_url', 'logo_alt_text', 'friendly_site_name',
        'link_1_label', 'link_1_url', 'link_2_label', 'link_2_url', 'link_3_label', 'link_3_url',
        'footer_text'
      ]
    ).tap do |whitelisted|
      whitelisted['domain_cname'] = request.host
    end
  end

end
