module Canvas2
  class Container < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      super(props, parent, resolver_context)
      # Reference the children here so they are instantiated, and get IDs
      children
    end

    def has_children?
      return @children.is_a?(Array) || @properties['children'].is_a?(Array)
    end

    def children
      return nil unless self.has_children?
      @children ||= CanvasWidget.from_config(@properties['children'], self).compact
    end

    def render_contents
      return ['', true] if !has_children?
      threads = children.map {|c| Thread.new { c.render }}
      results = threads.map {|thread| thread.value};
      [results.map {|r| r[0]}.join(''), results.reduce(true) {|memo, r| memo && r[1]},
        results.map {|r| r[2]}]
    end

    def child_context
      if @child_context.blank?
        if @properties.has_key?('childContextId')
          ccIds = string_substitute(@properties['childContextId'])
          if ccIds.is_a?(Array)
            @child_context = []
            ccIds.each {|cId| @child_context << get_context(cId)}
          else
            @child_context = get_context(ccIds)
          end
        else
          @child_context = self.context
        end
      end
      @child_context
    end

  protected
    def children=(children)
      @children = children
    end
  end
end
