module Canvas2
  class Util
    def self.allocate_id
      @@next_auto_id = 0 if !(defined? @@next_auto_id)
      's' + (@@next_auto_id += 1).to_s
    end

    def self.string_substitute(obj, resolver)
      if obj.blank?
        return ''
      elsif obj.is_a? String
        return Util.resolve_string(obj, resolver)
      elsif obj.is_a? Array
        return obj.map {|o| Util.string_substitute(o, resolver)}
      elsif obj.is_a? Hash
        o = {}
        obj.each {|k, v| o[k] = Util.string_substitute(v, resolver)}
        return o
      else
        return obj
      end
    end

    def self.set_params(params)
      @@page_params = params.reject {|k, v| k == 'controller' || k == 'action' || k == 'path'}
      add_vars(@@page_params)
    end

    def self.page_params
      @@page_params
    end

    def self.add_vars(vars)
      @@page_vars ||= {}
      @@page_vars.merge!(vars)
    end

    def self.page_vars
      @@page_vars
    end

    def self.set_path(path)
      @@page_path = path
    end

    def self.page_path
      defined? @@page_path ? @@page_path : nil
    end

    def self.component_data_page(c_id)
      return 1 if @@page_params.nil?
      c_id == @@page_params['data_component'] ? (@@page_params['data_page'] || '1').to_i : 1
    end

    def self.base_resolver
      lambda do |name|
        if name[0] == '?' && defined? @@page_vars
          return deep_get(@@page_vars || {}, name.slice(1, name.length))
        end
        nil
      end
    end

    def self.deep_get(obj, field)
      obj = obj.data if obj.respond_to?('data')
      obj = obj.with_indifferent_access
      keys = field.split('.')
      i = 0
      while i < keys.length do
        k = keys[i]
        obj = obj.data if obj.respond_to?('data')
        return nil if obj[k].blank?
        obj = obj[k]
        i += 1
      end
      obj
    end

    def self.array_to_obj_keys(arr, val)
      obj = {}
      arr = [arr] if !arr.is_a?(Array)
      arr.each { |k| obj[k] = val }
      obj
    end

    def self.app_helper
      AppHelper.instance
    end

    def self.render_partial(partial, assigns={})
      view = ActionView::Base.new(Rails::Configuration.new.view_path)
      ActionView::Base.included_modules.each { |helper| view.extend helper }
      view.extend ApplicationHelper
      view.render(partial, assigns)
    end

  private
    class AppHelper
      include ActionView::Helpers::TagHelper
      include ActionView::Helpers::UrlHelper
      include ActionView::Helpers::NumberHelper
      include Singleton
      include ApplicationHelper
    end

    def self.resolve_string(str, resolver)
      @@resolve_cache ||= {}
      compiled = @@resolve_cache[str]
      if compiled.blank?
        fn = lambda {|r| ''}
        m = str.split(/({|})/m)
        props = []
        i = 0
        while i < m.length do
          p = {}
          if m[i] == '{' && m[i + 2] == '}'
            p['orig'] = m[i + 1]
            p['prop'] = p['orig']
            p['prop'].match(/(.*)\s+\|\|\s*(.*)$/) do |m|
              p['prop'] = m[1]
              p['fallback'] = m[2]
            end

            p['transforms'] = []
            p['prop'].match(/(.*)\s+\/(\S*)\/(.*)\/([gim]*)$/) do |m|
              p['prop'] = m[1]
              p['transforms'] << {
                type: 'regex',
                regex: m[2],
                repl: m[3],
                modifiers: m[4]
              }
            end

            p['prop'].match(/(.*)\s+([%@])\[([^\]]*)\]$/) do |m|
              p['prop'] = m[1]
              t = case m[2]
                when '%' then 'number_format'
                when '@' then 'date_format'
              end
              p['transforms'] << {
                type: t,
                format: m[3]
              }
            end

            p['prop'].match(/(.*)\s+=\[([^\]]*)\]$/) do |m|
              p['prop'] = m[1]
              p['transforms'] << {
                type: 'math_expr',
                expr: m[2]
              }
            end

            i += 2
          else
            p['orig'] = m[i]
          end
          props << p
          i += 1
        end
        fn = Util.resolution_builder(props)
        @@resolve_cache[str] = fn
        compiled = @@resolve_cache[str]
      end
      compiled.call(resolver)
    end

    def self.resolution_builder(props)
      lambda do |resolver|
        if !resolver.is_a? Proc
          obj = resolver || {}
          resolver = lambda {|name| deep_get(obj, name)}
        end
        return props.map do |p|
          v = p['orig']
          if !p['prop'].blank?
            temp = resolver.call(p['prop'])
            if temp.blank?
              temp = p.has_key?('fallback') ? p['fallback'] : '{' + p['orig'] + '}'
            else
              temp = temp.map {|k, v| k + ': ' + v.to_s} if temp.is_a?(Hash)
              temp = temp.join(', ') if temp.is_a?(Array)
              p['transforms'].reverse.each do |pt|
                temp = @@apply_expr[pt[:type]].call(temp, pt) if
                  !temp.blank? && !@@apply_expr[pt[:type]].blank?
              end
            end
            v = temp
          end
          v
        end.join('')
      end
    end

    Default_Precison = 2

    @@apply_expr = {
      'regex' => lambda do |v, transf|
        # Woo, backslash
        repl = transf[:repl].gsub(/\$(\d)/, '\\\\\1')
        r = Regexp.new(transf[:regex],
                       (transf[:modifiers].include?('m') ? Regexp::MULTILINE : 0) |
                       (transf[:modifiers].include?('i') ? Regexp::IGNORECASE : 0))
        v = v.to_s
        transf[:modifiers].include?('g') ? v.gsub(r, repl) : v.sub(r, repl)
      end,

      'number_format' => lambda do |v, transf|
        return v if v.blank? || (!Float(v) rescue true)
        v = v.to_f

        prec = nil
        transf[:format].match(/\d+/) { |m| prec = m[0].to_i }

        use_padding = transf[:format].include?('p')
        commaify = transf[:format].include?(',')
        if transf[:format].include?('h')
          # Humane
          v = app_helper.number_to_human(v, :precision => prec.blank? ? Default_Precison : prec,
                              :significant => false,
                              :strip_insignificant_zeros => !use_padding,
                              :delimiter => commaify ? ',' : '',
                              :format =>  "%n%u",
                              :units => {
                                :unit => '',
                                :thousand => 'K',
                                :million => 'M',
                                :billion => 'B',
                                :trillion => 'T'
                              })
        elsif transf[:format].include?('e')
          # Scientific
          fmt = ('%' + (prec.blank? ? '' : '.' + prec.to_s) + 'e')
          v = fmt % v
          v = v.sub(/((\.[1-9]+)|\.)0+($|\D)/, '\2\3') if !use_padding
        elsif !prec.blank? || transf[:format].include?('f')
          # Standard fixed precision
          v = app_helper.number_with_precision(v, :precision => prec.blank? ? Default_Precision : prec,
                                   :strip_insignificant_zeros => !use_padding,
                                   :delimiter => commaify ? ',' : '')
        elsif commaify
          # commaify only
          v = app_helper.number_with_delimiter(v)
        end

        v.to_s
      end,

      'date_format' => lambda do |v, transf|
        if v.is_a?(Fixnum)
          d = Time.at(v)
        elsif v.is_a?(String)
          begin
            d = Time.parse(v)
          rescue ArgumentError => e
            d = nil
          end
        end
        return v if d.blank?

        fmt = transf[:format].blank? ? "%a %b %e %Y %H:%M:%S GMT%z (%Z)" : transf[:format]
        d.strftime(fmt)
      end
    }
  end
end
