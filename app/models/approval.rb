class Approval < Model
  cattr_accessor :notification_intervals

  def stages
    data['stages'] || []
  end

  def grandfather
    CoreServer::Base.connection.create_request("/#{self.class.service_name}.json?method=grandFatherIn")
  end

  def stage(stage_id)
    stages.detect {|s| s['id'] == stage_id} || {'name' => 'Not Ready Yet', 'id' => 0}
  end

  def is_approver?(user)
    stages.any? {|s| (s['approverUids'] || []).include?(user.id)}
  end

  @@notification_intervals = {
    "60" => "1 hour",
    "120" => "2 hours",
    "240" => "4 hours",
    "1440" => "1 day",
    "2880" => "2 days",
    "4320" => "3 days",
    "5760" => "4 days",
    "7200" => "5 days"
  }

protected
  # Turn class name into core server service name
  def self.service_name
    return self.name.gsub(/[A-Z]/){ |c| "_#{c.downcase}" }.gsub(/^_/, '')
  end

end
