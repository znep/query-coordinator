require 'base64'
require 'digest/sha1'
require 'securerandom'
require 'httparty'

module Auth0Helper
  def gen_cookie(uid)
    salt = SecureRandom.hex(8)

    # Expire in 15 minutes
    expiration = Time.now.to_i + 60 * 15

    # Core produces a cookie which is a base64 encoding of "uid expiration salt signature"
    Base64.strict_encode64("#{uid} #{expiration} #{salt} #{compute_signature(uid, expiration, salt)}")
  end

  private
  COOKIE_SECRET = "wm4NmtBisUd3XJ0JvQwJqTth8UdFvbYpy3LZ5IU3I3XCwG06XRa1TYXC3WySahssDzrt2cHFrbsRPT1o"

  def compute_signature(uid, expiration, salt)
    # Core produces a signature which is a SHA1 hash of the string "secret 4x4 expiration salt"
    Digest::SHA1.hexdigest("#{COOKIE_SECRET} #{uid} #{expiration} #{salt}")
  end

  def valid_token?(auth0Hash)
    contains_valid_email?(auth0Hash) &&
      contains_valid_name?(auth0Hash) &&
      contains_valid_userid?(auth0Hash)
  end

  def contains_valid_email?(auth0Hash)
    email = auth0Hash['email']
    !email.nil? &&
      !email.empty?
  end

  def contains_valid_name?(auth0Hash)
    displayName = auth0Hash['name']
    if !displayName.nil? &&
        !displayName.empty?
      true
    else
      firstName = auth0Hash['given_name'];
      lastName = auth0Hash ['last_name'];
      !firstName.nil? && !lastName.nil
    end
  end

  def contains_valid_userid?(auth0Hash)
    userId = auth0Hash['socrata_user_id']
    !userId.nil? && valid_userid_format?(userId)
  end

  def valid_userid_format?(userId)
    splitId = userId.split('|')

    #Make sure that none of the values are empty
    for split in splitId do
      if split.empty?
        return false
      end
    end

    #Finally, check to make sure that it has all three required fields
    splitId.length == 3
  end

  def username_password_connection?(socrata_user_id)
    socrata_user_id.start_with?('auth0|')
  end

  # In the username and password flow, the UID is set as part of authentication
  # It's going to come in with the form "auth0|abcd-efgh|connection_name"
  # Use a regex to attempt to extract it
  def extract_uid(socrata_user_id)
    trimmed_id = socrata_user_id.sub('auth0|','')
    trimmed_id.match(/(\w{4}-\w{4})(?=\|)/)
  end

  ##
  # Contact Auth0's API to test if the domain-specified connections
  # are in the set of Socrata's connections.
  def connection_exists(name)
    response = HTTParty.get("https://#{AUTH0_URI}/api/v2/connections?fields=name", headers: {
      'Authorization' => "Bearer #{AUTH0_JWT}"
    })

    if response.is_a? Array
      response.any? { |connection| connection['name'] == name }
    end
  end

  ##
  # Generate an authorization URI that can be used to
  # authenticate a user with the give Auth0 connection string.
  #
  # Connection strings correspond to providers. If the provider
  # is unavailable, then the system will fail.
  def generate_authorize_uri(connection, callback_uri)
    parameters = {
      :scope => "openid profile",
      :response_type => "code",
      :connection => connection,
      :callbackURL => callback_uri,
      :sso => true,
      :client_id => AUTH0_ID,
      :redirect_uri => callback_uri
    };

    URI::escape(
      "https://#{AUTH0_URI}/authorize?" <<
      parameters.map { |key, value| key.to_s << '=' << value.to_s }.join('&')
    )
  end
end
