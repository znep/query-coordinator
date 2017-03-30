class Metric
  attr_reader :entity_id, :name, :count, :timestamp, :type

  def initialize(entity_id, name, count = 1)
    @entity_id = entity_id
    @name = name
    @count = count
    @timestamp = Time.now.to_i * 1000
    @type = 'aggregate'
  end

  def to_hash
    {
      timestamp: timestamp,
      entityId: entity_id,
      name: name,
      value: count,
      type: type
    }
  end
end
