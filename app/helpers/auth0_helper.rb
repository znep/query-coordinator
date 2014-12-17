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
end
