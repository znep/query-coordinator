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
      @signup = SignupPresenter.new(nil, session)
      @signup.user = rpx_authentication.user if rpx_authentication.user
      @user_session = UserSession.new
    end
  end
end
