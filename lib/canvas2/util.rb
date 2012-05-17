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
            p['prop'].match(/(.*)\s+\/(\S*)\/(.*)\/([gim]*)$/) do |m|
              p['prop'] = m[1]
              p['regex'] = m[2]
              p['repl'] = m[3]
              p['modifiers'] = m[4]
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
              if p.has_key?('regex')
                # Woo, backslash
                repl = p['repl'].gsub(/\$(\d)/, '\\\\\1')
                r = Regexp.new(p['regex'],
                               (p['modifiers'].include?('m') ? Regexp::MULTILINE : 0) |
                               (p['modifiers'].include?('i') ? Regexp::IGNORECASE : 0))
                temp = p['modifiers'].include?('g') ? temp.gsub(r, repl) : temp.sub(r, repl)
              end
            end
            v = temp
          end
          v
        end.join('')
      end
    end
  end
end
