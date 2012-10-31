module Canvas2
  class HorizontalContainer < Container
    def render_classes
      @properties['inlineDisplay'] ? 'inlineDisplay' : ''
    end

    def render_contents
      t = ''
      fully_rendered = true
      child_timings = []
      if has_children?
        i_d = @properties['inlineDisplay']
        vc = children.reject { |c| c.is_hidden }
        total_weight = vc.reduce(0.0) {|sum, c| sum + (c.properties['weight'] || 1).to_f}
        pos = 0.0
        vc.each_with_index do |c, i|
          w = (c.properties['weight'] || 1).to_f
          r = c.render
          t += '<div class="component-wrapper' + (i == 0 ? ' first-child' : '') + '"' +
            (i_d ? '' : (' style="margin-left:' + (-(100 - pos / total_weight * 100)).round(2).to_s + '%;' +
             'width:' + (w / total_weight * 100).round(2).to_s + '%;"')) +
            '>' + r[0] + '</div>'
          fully_rendered &&= r[1]
          pos += w
          child_timings.push(r[2])
        end
      end
      [t += '<div class="socrata-ct-clear"></div>', fully_rendered, child_timings]
    end
  end
end
