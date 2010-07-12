class SignupPresenter < Presenter
  include ActionView::Helpers::TranslationHelper

  def_delegators :user,  :firstName,  :lastName,  :email,  :screenName, :login,  :password,  :company,  :title,  :openIdIdentifierId,
                 :user=, :firstName=, :lastName=, :email=, :screenName=, :login=, :password=, :company=, :title=, :openIdIdentifierId=

  attr_accessor :user
  attr_accessor :inviteToken
  attr_accessor :profile_image
  attr_accessor :errors
  attr_accessor :accept_terms

  attr_accessor :emailConfirm, :passwordConfirm

  def initialize(params = {}, inviteToken = nil)
    @user = User.new
    @inviteToken = inviteToken
    @errors = []

    super(params)
  end

  def create
    if accept_terms
      create_user && login!
    else
      @errors << "You must accept the terms of service and privacy policy."
    end

    return @errors.empty?
  end

protected

  def create_user
    temp_password = user.password
    @user = user.create(inviteToken)
    @user.password = temp_password
    true
  rescue CoreServer::CoreServerError => e
    @errors << e.error_message
    false
  end

  def login!
    user_session = UserSession.user_no_security_check(@user)
  end
end
