class SignupPresenter < Presenter
  include ActionView::Helpers::TranslationHelper

  def_delegators :user,  :firstName,  :lastName,  :email,  :login,  :password,  :company,  :title,  :openIdIdentifierId,
                 :user=, :firstName=, :lastName=, :email=, :login=, :password=, :company=, :title=, :openIdIdentifierId=

  attr_accessor :user
  attr_accessor :inviteToken
  attr_accessor :profile_image
  attr_accessor :inviteOthers
  attr_accessor :errors

  attr_accessor :emailConfirm, :passwordConfirm

  def initialize(params = {}, inviteToken = nil)
    @user = User.new
    @inviteToken = inviteToken
    @errors = []

    super(params)
  end

  def create
    if create_user && login!
      send_invites
      update_profile_photo
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
    user_session = UserSession.new('login' => login, 'password' => password)
    user_session.save
  end

  def send_invites
    # If there were any email addresses in the Invite Others field,
    # create some invitations and send them to the core server.
    unless inviteOthers.blank?
      emails = inviteOthers.split(",").map {|e| e.strip}
      emails.each do |email|
        begin
          InvitationRecord.create({:recipientEmail => email, :message => t(:invitation_email_text)})
        end
      end
    end
  end

  def update_profile_photo
    # If they gave us a profile photo, upload that to the user's account
    # If the core server gives us an error, oh well... we've alredy created
    # the account, so we might as well send them to the main page, sans
    # profile photo.
    unless profile_image.blank? || !profile_image.kind_of?(Tempfile)
      user.profile_image = profile_image
    end
  rescue CoreServer::CoreServerError => e
    @errors << "Unable to update profile photo: #{e.error_code} #{e.error_message}"
  end
end
