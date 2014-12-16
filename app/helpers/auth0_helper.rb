require 'base64'
require 'digest/sha1'
require 'securerandom'

module Auth0Helper
  def gen_cookie(uid)
    cookie_secret = "wm4NmtBisUd3XJ0JvQwJqTth8UdFvbYpy3LZ5IU3I3XCwG06XRa1TYXC3WySahssDzrt2cHFrbsRPT1o"
    salt = SecureRandom.hex(8)

    # Expire in 15 minutes
    expiration = Time.now.to_i + 60 * 15

    # Core produces a signature which is a SHA1 hash of the string "secret 4x4 expiration salt"
    signature = Digest::SHA1.hexdigest("#{cookie_secret} #{uid} #{expiration} #{salt}")

    # Core produces a cookie which is a base64 encoding of "uid expiration salt signature"
    Base64.strict_encode64("#{uid} #{expiration} #{salt} #{signature}")
  end
end
