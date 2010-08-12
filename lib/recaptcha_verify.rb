require 'net/http'

class RecaptchaVerify
  def self.verify(remote_ip, challenge, response)
    response = Net::HTTP.post_form(URI.parse('http://www.google.com/recaptcha/api/verify'),
                                   {'privatekey' => APP_CONFIG['recaptcha_private_key'],
                                    'remoteip' => remote_ip,
                                    'challenge' => challenge,
                                    'response' => response})
    answer, error = response.body.split.map {|s| s.chomp}

    {:answer => answer, :error => error}
  end
end
