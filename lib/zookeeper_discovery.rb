require 'zk'

class ZookeeperDiscovery

  def self.initialize!
    client
    @@_services = {}
  end

  def self.get(service)
    # for now, dumbest possible load-balancing.
    _get(service.to_sym).sample
  end

  def self.get_json(service_path)
    JSON.parse(client.get(service_path).first)
  end

  protected

  def self._get(service)
    initialize! if defined?(@@_services).nil?

    if @@_services[service].nil?
      path = "/#{service}"

      client.wait_until_connected
      client.register(path) do |event|
        # this is the dumbest API ever. normally one would filter on what
        # kind of event it is, and only synchronously block with a new child
        # read request if the children in fact changed. but because of the
        # way this client library registers for events, i have to reregister
        # the watch no matter what, which one cannot do without also making
        # the synchronous read request. ugh.
        @@_services[service] = client.children(path, :watch => true)
        Rails.logger.info "Got new #{service} servers: #{@@_services[service].inspect}"
      end
      @@_services[service] = client.children(path, :watch => true)
    else
      @@_services[service]
    end
  end

  def self.client
    if (defined? @@_client).nil? || @@_client.closed?
      @@_client = connect
    else
      @@_client
    end
  end

  def self.connect
    zookeeper_host = nil
    ensemble = Rails.application.config.zookeeper.ensemble

    begin
      zookeeper_host = ensemble.sample
    rescue NoMethodError
      raise "Rails.application.config.zookeeper.ensemble cannot be sampled: #{ensemble.inspect}"
    end

    Rails.logger.info("Connecting to Zookeeper... (#{zookeeper_host})")
    ZK.install_fork_hook
    ZK::Client.new(zookeeper_host)
  end

end
