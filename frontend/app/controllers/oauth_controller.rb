class OauthController < ApplicationController
  def authorize
    @oauth_params = {
      :client_id => params[:client_id],
      :response_type => params[:response_type],
      :redirect_uri => params[:redirect_uri],
      :state => params[:state]
    }

    if @oauth_params[:client_id].blank? || @oauth_params[:response_type].blank?
      flash.now[:error] = t('screens.profile.edit.app_tokens.oauth_error_invalid_app_token')
      return render 'shared/error', :status => :invalid_request
    end

    @app_token = AppToken.find(params[:client_id])
    if @app_token.nil?
      flash.now[:error] = t('screens.profile.edit.app_tokens.oauth_error_invalid_app_token')
      return render 'shared/error', :status => :not_found
    end

    @redirect_uri = URI.parse(params[:redirect_uri] || '')
    if (@redirect_uri.scheme != 'http') || (!@redirect_uri.to_s.start_with? @app_token.baseUri)
      @redirect_uri = 'javascript:history.back(1)'
    end
  end
end
