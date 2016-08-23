require 'net/ping'

class Vpn
  def self.active?
    Net::Ping::External.new('marathon.aws-us-west-2-rc.socrata.net').ping?
  end
end
