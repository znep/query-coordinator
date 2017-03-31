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
      raise "Jenkins auth not configured, set #{USERNAME_ENV_KEY} and #{TOKEN_ENV_KEY} in your environment. Get them from https://jenkins-build.socrata.com/me/configure (click 'Show API token')"
    end
    true
  end

  # Given a release sha, return the latest release build number that
  # successfully built that sha or nil if none exists.
  #
  # release_sha: Sha to search for.
  def self.find_storyteller_release_build(release_sha)
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

  # Given an upstream build number, return the corresponding downstream build number.
  #
  # upstream_build_number: Build number to search for.
  # upstream_project: Upstream project to search within.
  def self.find_downstream_storyteller_build(upstream_build_number, upstream_project = 'storyteller-release')
    build_numbers = api.job.get_builds('storyteller').map {|rel| rel['number']}.sort.reverse
    build_numbers.find do |build_number|
      details = api.job.get_build_details('storyteller', build_number)
      # 'actions' and 'causes' are both arrays, and 'actions' may have multiple
      # object members with a 'causes' key... hence this weird search structure.
      details['result'] == 'SUCCESS' && details['actions'].find do |action|
        action.has_key?('causes') && action['causes'].find do |cause|
          cause['upstreamProject'] == upstream_project && cause['upstreamBuild'] == upstream_build_number
        end
      end
    end
  end

  # Given a build number, parse the Docker tag from a build artifact.
  #
  # build_number: Build number to search for
  def self.get_docker_tag_from_build(build_number)
    details = api.job.get_build_details('storyteller', build_number)

    # We can't use the similar functionality from JenkinsApi::Client because
    # it always assumes the latest build instead of a specific build number
    # and it also insists on writing to a file on disk automatically.
    #
    # The code below is mostly copied from the API client source code.
    job_path = details['url']
    artifact_relative_path = details['artifacts'][0]['relativePath']
    artifact_uri = URI.escape("#{job_path}artifact/#{artifact_relative_path}")

    uri = URI.parse(artifact_uri)
    http = Net::HTTP.new(uri.host, uri.port)
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    http.use_ssl = true
    request = Net::HTTP::Get.new(uri.request_uri)
    request.basic_auth(ENV[USERNAME_ENV_KEY], ENV[TOKEN_ENV_KEY])
    response = http.request(request)

    if response.code == '200'
      # In marathon.properties, the first line defines the Docker image URI,
      # and the last path segment of that URI specifies the Docker tag.
      response.body.split.first.split('/').last
    else
      raise "Unable to fetch artifact for storyteller build #{build_number}"
    end
  end

  def self.api
    assert_auth_configured
    JenkinsApi::Client.new(server_url: JENKINS_URL, username: ENV[USERNAME_ENV_KEY], password: ENV[TOKEN_ENV_KEY], log_level: Logger::WARN)
  end

end
