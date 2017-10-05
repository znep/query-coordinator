class SignupPresenter < Presenter
  include ActionView::Helpers::TranslationHelper

  def_delegators :user,  :firstName,  :lastName,  :email,  :screenName,  :login,  :password,  :company,  :title, :auth0Identifier,
                 :user=, :firstName=, :lastName=, :email=, :screenName=, :login=, :password=, :company=, :title=, :auth0Identifier=

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

    @errors = Hash.new { |h, k| h[k] = [] } # Note: This hash cannot be Marshal#dump'd with this default proc.

    super(params)
  end

  def create
    if password != passwordConfirm
      @errors[:password] << t('account.common.validation.mismatch')
    end
    if !accept_terms
      @errors[:terms] << t('account.common.validation.terms')
    end
    if @errors.empty?
      if FeatureFlags.derive[:enable_new_account_verification_email]
        begin
          user.create(inviteToken, authToken)

          # if authToken is present, they are coming from a future account
          # this means that they don't need to verify their email and can just be logged in
          if authToken
            login!
          end

          return true
        rescue CoreServer::CoreServerError => e
          @errors[:core] << e.error_message
          return false
        end
      else
        return (create_user && login!)
      end
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
    @errors[:core] << e.error_message
    false
  end

  def login!
    user_session = UserSessionProvider.klass.user_no_security_check(@user)
  end
end
