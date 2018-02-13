#!/usr/bin/env ruby

require 'csv'
require 'httparty'

site_chrome_configs = {}

%w(
  us-east-1-fedramp-prod
  eu-west-1-prod
).each do |env|

  stories_domains = HTTParty.get(
    "http://feature-flag-monitor.app.marathon.aws-#{env}.socrata.net/report/stories_enabled.json",
    format: :json
  )

  stories_domains['domains'].each do |(domain, enabled)|
    next unless enabled

    puts "Getting site chrome config from #{domain}"
    site_chrome_config = nil
    begin
      site_chrome_config = HTTParty.get("https://#{domain}/api/configurations.json?type=site_chrome")
    rescue => error
      puts "Error getting site chrome config from #{domain}: #{error.message}"
    end

    unless site_chrome_config.nil? || site_chrome_config.empty?
      site_chrome_configs[domain] = site_chrome_config.first['properties']
    end
  end
end

File.open("site_chrome_configs_#{Time.now.to_i}.json", 'w') do |f|
  f.write(JSON.pretty_generate(site_chrome_configs))
end
