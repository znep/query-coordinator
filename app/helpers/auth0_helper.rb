require 'base64'
require 'digest/sha1'
require 'securerandom'

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
    (contains_valid_email?(auth0Hash) &&
     contains_valid_name?(auth0Hash) &&
     contains_valid_userid?(auth0Hash))
  end

  def contains_valid_email?(auth0Hash)
    email = auth0Hash["email"]
    (!email.nil? &&
     !email.empty?)
  end

  def contains_valid_name?(auth0Hash)
    displayName = auth0Hash["name"]
    if (!displayName.nil? &&
        !displayName.empty?)
      true
    else
      firstName = auth0Hash["given_name"]; 
      lastName = auth0Hash ["last_name"];
      (!firstName.nil? && !lastName.nil)    
    end
  end

  def contains_valid_userid?(auth0Hash)
    userId = auth0Hash["socrata_user_id"]
    (!userId.nil? && valid_userid_format?(userId))
  end

  def valid_userid_format?(userId)
    splitId = userId.split("|")

    #Make sure that none of the values are empty
    for split in splitId do
      if split.empty?
        return false
      end
    end

    #Finally, check to make sure that it has all three required fields
    (splitId.length == 3)
  end
end
