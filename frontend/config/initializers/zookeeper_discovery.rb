unless ENV['DISABLE_ZOOKEEPER'].present?
  ZookeeperDiscovery.initialize!
end
