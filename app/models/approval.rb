class Approval < Model
  cattr_accessor :notification_intervals

  def stages
    data['stages'] || []
  end

  def age_info
    if @age_info.nil?
      path = "/#{self.class.service_name}.json?method=ageInfo"
      @age_info = JSON.parse(CoreServer::Base.connection.get_request(path)).
        reject {|ai| stage(ai['approval_stage_id'])['id'] != ai['approval_stage_id']}
    end
    @age_info
  end

  def aging_info(groups = 5)
    @aging_info = {} if @aging_info.nil?
    if @aging_info[groups].nil?
      path = "/#{self.class.service_name}.json?method=aging&max_group=#{groups}&interval=86400"
      result = JSON.parse(CoreServer::Base.connection.get_request(path))

      as = {'approval_stage_id' => 0, 'counts' => []}
      result.select {|r| r['approval_stage_id'] == 0}.each {|r| as['counts'][r['aging_unit']] = r['count']}
      @aging_info[groups] = [as]
      stages.each do |s|
        as = {'approval_stage_id' => s['id'], 'counts' => []}
        result.select {|r| r['approval_stage_id'] == s['id']}.
          each {|r| as['counts'][r['aging_unit']] = r['count']}
        @aging_info[groups] << as
      end
    end
    @aging_info[groups]
  end

  def grandfather
    CoreServer::Base.connection.create_request("/#{self.class.service_name}.json?method=grandFatherIn")
  end

  def stage(stage_id)
    stages.detect {|s| s['id'] == stage_id} || {'name' => 'Not Ready Yet', 'id' => 0}
  end

  def is_approver?(user)
    stages.any? {|s| s['approverUids'].include?(user.id)}
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
