class StaticAssetBalancer
  def initialize(*hosts)
    @hosts = hosts
    @count = hosts.length
  end

  def call(source, request)
    if request && request.ssl?
      "#{request.protocol}#{@hosts[source.hash % @count]}"
    else
      "http://#{@hosts[source.hash % @count]}"
    end
  end
end
