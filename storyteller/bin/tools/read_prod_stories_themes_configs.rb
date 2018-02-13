#!/usr/bin/env ruby

require 'csv'
require 'httparty'

theme_configs = {}

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

    puts "Getting story theme config from #{domain}"
    story_theme_config = nil
    begin
      story_theme_config = HTTParty.get("https://#{domain}/api/configurations.json?type=story_theme")
    rescue => error
      puts "Error getting story theme config from #{domain}: #{error.message}"
    end
    theme_configs[domain] = story_theme_config unless story_theme_config.nil?
  end
end

File.open("story_theme_configs_#{Time.now.to_i}.json", 'w') do |f|
  f.write(JSON.pretty_generate(theme_configs))
end
