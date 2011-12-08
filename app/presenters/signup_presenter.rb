class SignupPresenter < Presenter
  include ActionView::Helpers::TranslationHelper

  def_delegators :user,  :firstName,  :lastName,  :email,  :screenName, :login,  :password,  :company,  :title,  :openIdIdentifierId,
                 :user=, :firstName=, :lastName=, :email=, :screenName=, :login=, :password=, :company=, :title=, :openIdIdentifierId=

  attr_accessor :user
  attr_accessor :inviteToken
  attr_accessor :authToken
  attr_accessor :profile_image
  attr_accessor :errors
  attr_accessor :accept_terms

  attr_accessor :emailConfirm, :passwordConfirm

  def initialize(params = {}, inviteToken = nil, authToken = nil)
    @user = User.new
    @inviteToken = inviteToken
    @authToken = authToken

    @errors = []

    super(params)
  end

  def create
    if password != passwordConfirm
      @errors << "Passwords do not match."
    end
    if !accept_terms
      @errors << "You must accept the terms of service and privacy policy."
    end
    if @errors.empty?
      create_user && login!
      return true
    end

    false
  end

protected

  def create_user
    temp_password = user.password
    @user = user.create(inviteToken, authToken)
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
