require 'user_agent_parser'

module BrowserTypeHelper
  def browser_from_user_agent(user_agent)
    @parser ||= UserAgentParser::Parser.new

    browser = @parser.parse(user_agent)

    family, mobile, os = browser.family.split(' ')

    family = 'Safari' if mobile == 'Safari'

    processed_family = case family
      when 'Chromium'
        'chrome'
      when 'Chrome', 'Firefox', 'IE', 'Safari'
        family.downcase
      else
        'other'
    end

    properties = {
      :family => processed_family,
      :mobile => mobile.present?
    }

    if browser.version.present? && processed_family != 'other'
      properties.merge(:version => browser.version.major)
    else
      properties
    end
  end
end
