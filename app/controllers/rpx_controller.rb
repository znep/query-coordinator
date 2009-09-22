class RpxController < ApplicationController
  ssl_required :return_login, :return_signup, :login, :signup
  skip_before_filter :require_user
  protect_from_forgery :except => [:return_login, :return_signup]
  before_filter :set_empty_user_session

  # Create a new user, automatically associating the OpenID credentials they
  # already provided to sign them up.
  def signup
    @signup = SignupPresenter.new(params[:signup])
    if @signup.create
      redirect_back_or_default(profile_path(@signup.user.id, :welcome => true))
    else
      flash.now[:error] = @signup.errors.join(", ")
      render :action => :return_signup
    end
  end

  # POSTed by RPX back to us when a user attempts to sign up via OpenID.
  # Offer the ability to finish creating your new account.
  def return_signup
    return (redirect_to signup_path) unless params[:token]
    login_or_signup
  end

  # Log in a user, linking the new OpenID credentials with the existing account
  def login
    @signup = SignupPresenter.new(params[:signup])
    @user_session = UserSession.new(params[:user_session])
    if @user_session.save
      current_user.openIdIdentifierId = @signup.openIdIdentifierId
      current_user.save!
      redirect_to(account_path(:anchor => "openid"))
    else
      flash.now[:notice_login] = "Unable to login with that username and password; please try again"
      render :action => :return_login
    end
  end

  # POSTed by RPX back to us when a user attempts to log in via OpenID.
  # They could be one of two primary cases:
  # 1. They have an account already linked. Great, log them in.
  # 2. They don't have an account linked. Offer the ability to create a new
  #    account OR link it to an existing account.
  def return_login
    return (redirect_to login_path) unless params[:token]
    login_or_signup
  end

private
  def set_empty_user_session
    @user_session = UserSession.new
  end

  def login_or_signup
    rpx_authentication = RpxAuthentication.new(params[:token])
    if (rpx_authentication.existing_account?)
      user_session = UserSession.rpx(rpx_authentication)
      redirect_back_or_default(home_path)
    else
      @body_id = 'signup'
      @signup = SignupPresenter.new
      @signup.user = rpx_authentication.user if rpx_authentication.user
      render :template => 'rpx/return_login'
    end
  end
end
