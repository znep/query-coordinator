class RpxController < ApplicationController
  ssl_required :return_token
  skip_before_filter :require_user
  protect_from_forgery :except => [:return_token]


  def return_token
    return (redirect_to login_path) unless params[:token]

    rpx_authentication = RpxAuthentication.new(params[:token])
    if (rpx_authentication.existing_account?)
      user_session = UserSession.rpx(rpx_authentication)
      redirect_back_or_default(home_path)
    else
      @account = rpx_authentication.user
    end
  end

  def signup
  end

  def login
  end
end
