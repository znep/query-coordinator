class TranslationsController < ApplicationController
  skip_before_filter :require_user, :set_user, :set_meta, :hook_auth_controller, :sync_logged_in_cookie, :only => :get

  def get
    return render_404 if params[:locale_parts].empty?

    result = LocaleCache.render_translations([LocalePart.from_array(params[:locale_parts])])
    return render_404 if result.nil?

    render :json => result, :content_type => 'application/json'
  end
end