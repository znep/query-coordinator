require 'httparty'

# Recaptcha v2+ requires us to verify domain names of requests if we turn
# off domain name validation via the Recaptcha admin console. We have to
# turn off this validation, as Google limits us to 50 domains per key if
# we use the default domain validation through the admin console.
#
# See here for more information:
# https://developers.google.com/recaptcha/docs/domain_validation
#
# TODO: Remove this class once we upgrade Recaptcha across the platform and
# can then upgrade the Recaptcha gem, since it can handle most of this.
class SocrataRecaptcha
  def self.valid(response_token)
    if response_token.blank?
      return false
    end

    response = HTTParty.post(recaptcha_url, {
      :body => {
        :secret => RECAPTCHA_2_SECRET_TOKEN,
        :response => response_token
      }
    })

    if response.success?
      valid_recaptcha = response.parsed_response.fetch('success', false)
      requesting_domain = response.parsed_response.fetch('hostname', nil)

      valid_recaptcha && requesting_domain == CurrentDomain.cname
    else
      false
    end
  end

  def self.recaptcha_url
    'https://www.google.com/recaptcha/api/siteverify'
  end
end
