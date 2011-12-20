class Template < SodaModel
  def identifier
    @data['identifier']
  end

  def name
    @data['name']
  end

  def content
    @data['content']
  end

  def self.[](id)
    find(:identifier => id, :status => :published).first
  end

  def page
    {
      content: insertions.map{ |ins| insertion_line(ins) }
    }
  end

  # The canvas items that need to be populated before page instantiation
  def insertions
    @insertions ||= get_insertions(content)
  end

  private
  def get_insertions(tree)
    if tree.kind_of? Hash
      if tree['type'] == 'insertion'
        tree
      elsif tree['children']
        get_insertions(tree['children'])
      end
    elsif tree.kind_of? Array
      tree.map{ |leaf| get_insertions(leaf) }.flatten.compact
    else
      Rails.logger.error "Don't know how to handle #{tree.inspect}"
    end
  end

  def insertion_line(insertion)
    insertion['content'].merge(editable: true, id: insertion['id'])
  end
end
