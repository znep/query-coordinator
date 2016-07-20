require 'marathon'

class StorytellerRelease
  MARATHON_ENDPOINTS = {
    'us-west-2-rc' => 'http://marathon.aws-us-west-2-rc.socrata.net',
    'us-west-2-prod' => 'http://marathon.aws-us-west-2-prod.socrata.net',
    'eu-west-1-prod' => 'http://marathon.aws-eu-west-1-prod.socrata.net',
    'us-east-1-fedramp-prod' => 'http://marathon.aws-us-east-1-fedramp-prod.socrata.net'
  }
  CONSUL_ENDPOINTS = {
    'us-west-2-rc' => 'http://consul.aws-us-west-2-rc.socrata.net',
    'us-west-2-prod' => 'http://consul.aws-us-west-2-prod.socrata.net',
    'eu-west-1-prod' => 'http://consul.aws-eu-west-1-prod.socrata.net',
    'us-east-1-fedramp-prod' => 'http://consul.aws-us-east-1-fedramp-prod.socrata.net'
  }

  attr_accessor :environment, :full_version, :semver, :marathon_app

  def initialize(environment, marathon_app)
    @environment = environment
    @marathon_app = marathon_app
    @full_version = marathon_app.container.docker.image.match(/storyteller:(.*)$/)[1]
    @semver = 'v' + @full_version.split('_')[0]
  end

  # Is the release active in its environment?
  def active?
    active_version_in_environment == semver
  end

  def activate!
    configure_diplomat
    Diplomat::Kv.put('storyteller/active_version', semver.tr('v', ''))
  end

  def self.find_in_all_environments
    all_environments.each_with_index.map do |environment, i|
      yield(environment, i, all_environments.length) if block_given?
      find_in_environment(environment)
    end.flatten
  end

  def self.all_environments
    MARATHON_ENDPOINTS.keys
  end

  def self.find_in_environment(environment)
    endpoint = MARATHON_ENDPOINTS[environment]
    raise "No marathon endpoint is defined for #{environment}, check StorytellerRelease" unless endpoint

    Marathon.url = endpoint
    retry_count = 3
    begin
      retry_count -= 1

      raise "Cannot reach marathon endpoint (#{endpoint}) for #{environment}" unless Marathon.ping

      marathon_apps = Marathon::App.list(nil, nil, 'storyteller/') # slash is significant, excludes storyteller-worker
    rescue Net::OpenTimeout => e
      if retry_count > 0
        retry
      else
        raise e
      end
    end

    marathon_apps.map do |marathon_app|
      StorytellerRelease.new(environment, marathon_app)
    end
  end

  private
  def configure_diplomat
    Diplomat.configure do |config|
      config.url = CONSUL_ENDPOINTS[environment]
    end
  end

  def active_version_in_environment
    configure_diplomat
    'v' + Diplomat::Kv.get('storyteller/active_version')
  end
end
