class RpxController < ApplicationController
  include UserSessionsHelper
  skip_before_filter :require_user
  protect_from_forgery :except => [:return_login, :return_signup]
  before_filter :set_empty_user_session
  cattr_accessor :auth_providers

  # Create a new user, automatically associating the OpenID credentials they
  # already provided to sign them up.
  def signup
    @signup = SignupPresenter.new(params[:signup])
    if @signup.create
      redirect_to(profile_path(@signup.user))
    else
      flash.now[:error] = @signup.errors.join(", ")
      @body_id = 'signup'
      render :template => 'rpx/return_login'
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
      redirect_to login_redirect_url
    else
      flash.now[:notice_login] = "Unable to login with that username and password; please try again"
      @body_id = 'signup'
      render :template => 'rpx/return_login'
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
      redirect_back_or_default(login_redirect_url)
    else
      @body_id = 'signup'
      @signup = SignupPresenter.new
      @signup.user = rpx_authentication.user if rpx_authentication.user
      @signup.emailConfirm = @signup.email
      render :template => 'rpx/return_login'
    end
  end

  @@auth_providers = [
    {:name => 'Facebook', :id => 'facebook', :rpx_url => APP_CONFIG['rpx_facebook_url']},
    {:name => 'Twitter', :id => 'twitter', :rpx_url => APP_CONFIG['rpx_twitter_url']},
    {:name => 'Google', :id => 'google', :rpx_url => APP_CONFIG['rpx_googleplus_url']},
    {:name => 'OpenID', :id => 'openid', :rpx_url => APP_CONFIG['rpx_signin_url'],
      :class => 'rpxnow', :href => true}
  ]
end
