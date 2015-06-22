# TODO Michael Brown is planning to move this into a gem with DecimaClient
module Aws
  class Deploy
    def initialize(d)
      @d = d
      @service = @d['service']
    end

    ## accessors
    attr_accessor :service

    def version
      @d['version']
    end

    def environment
      @d['environment']
    end

    def service_sha
      @d['service_sha']
    end

    def docker_sha
      @d['docker_sha']
    end

    def docker_tag
      @d['docker_tag']
    end

    def deployed_at
      @deployed_at ||= Time.parse(@d['deployed_at'])
    end

    def deployed_by
      @d['deployed_by']
    end

    def deploy_method
      @d['deploy_method']
    end

    ## utility methods

    def diff(deploy)
      if deploy.nil?
        return 'not found'
      end
      diffs = []
      if version != deploy.version
        diffs << "ver: #{deploy.version}"
      end
      if service_sha != deploy.service_sha
        diffs << "sha: #{deploy.service_sha}"
      end
      if docker_tag != deploy.docker_tag
        diffs << "tag: #{deploy.docker_tag}"
      end
      if diffs.size > 0
        return diffs.join(', ')
      else
        return 'match'
      end
    end

    def to_s
      "#{service}@#{version}"
    end

    def to_hash
      @d
    end

    def ==(deploy)
      ret = self.version == deploy.version &&
            self.service_sha == deploy.service_sha
      unless self.docker_tag.nil? || deploy.docker_tag.nil?
        ret = ret && self.docker_tag == deploy.docker_tag
      end
      ret
    end

  end
end
