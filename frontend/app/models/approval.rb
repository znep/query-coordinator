class Approval < Model

  def stages
    data['stages'] || []
  end

  def grandfather
    CoreServer::Base.connection.create_request("/#{self.class.service_name}.json?method=grandFatherIn")
  end

  def stage(stage_id)
    stages.detect {|s| s['id'] == stage_id} || {'name' => I18n.t('screens.admin.routing_approval.not_ready_yet'), 'id' => 0}
  end

  def is_approver?(user)
    stages.any? {|s| (s['approverUids'] || []).include?(user.id)}
  end

  def self.notification_intervals
    {
      60 => I18n.t('screens.admin.routing_approval.hour', :count => 1),
      120 => I18n.t('screens.admin.routing_approval.hour', :count => 2),
      240 => I18n.t('screens.admin.routing_approval.hour', :count => 4),
      1440 => I18n.t('screens.admin.routing_approval.day', :count => 1),
      2880 => I18n.t('screens.admin.routing_approval.day', :count => 2),
      4320 => I18n.t('screens.admin.routing_approval.day', :count => 3),
      5760 => I18n.t('screens.admin.routing_approval.day', :count => 4),
      7200 => I18n.t('screens.admin.routing_approval.day', :count => 5)
    }
  end

protected
  # Turn class name into core server service name
  def self.service_name
    return self.name.gsub(/[A-Z]/){ |c| "_#{c.downcase}" }.gsub(/^_/, '')
  end

end
