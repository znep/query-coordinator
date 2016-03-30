require 'logger'
require 'jenkins_api_client'

class Jenkins
  JENKINS_URL = 'https://jenkins-build.socrata.com'
  STORYTELLER_RELEASE_JOB_NAME = 'storyteller-release'
  USERNAME_ENV_KEY = 'JENKINS_USER'
  TOKEN_ENV_KEY = 'JENKINS_API_TOKEN'

  def self.auth_configured?
    ENV[USERNAME_ENV_KEY] && ENV[TOKEN_ENV_KEY]
  end

  def self.assert_auth_configured
    unless auth_configured?
      raise "Jenkins auth not configured, set #{USERNAME_ENV_KEY} and #{TOKEN_ENV_KEY} in your environment from https://jenkins-build.socrata.com/me/configure"
    end
  end

  # Given a release sha, return the latest release build number that
  # successfully built that sha or nil if none exists.
  #
  # release_sha: Sha to search for.
  # limit_to: Limit search to the latest limit_to builds.
  def self.find_storyteller_release_build(release_sha, limit_to = 5)
    raise "#{STORYTELLER_RELEASE_JOB_NAME} job not found in jenkins!" unless api.job.exists?(STORYTELLER_RELEASE_JOB_NAME)
    build_numbers = api.job.get_builds('storyteller-release').map {|rel| rel['number']}.sort.reverse
    build_numbers.find do |build_number|
      details = api.job.get_build_details('storyteller-release', build_number)
      if details['result'] == 'SUCCESS'
        found_action_shas = details['actions'].map do |action|
          branches = action['buildsByBranchName']
          if branches
            branches.values.map { |branch| branch['revision']['SHA1'] }
          end
        end.compact.flatten

        found_action_shas.include?(release_sha)
      end
    end
  end

  def self.api
    assert_auth_configured
    JenkinsApi::Client.new(server_url: JENKINS_URL, username: ENV[USERNAME_ENV_KEY], password: ENV[TOKEN_ENV_KEY], log_level: Logger::WARN)
  end
    
end
