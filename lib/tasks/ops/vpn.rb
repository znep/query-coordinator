require 'net/ip'

class Vpn
  def self.active?
    Net::IP.routes.any? { |r| r.prefix == '10.0.0.0/8' }
  end
end
