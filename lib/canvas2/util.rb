# encoding: UTF-8

module Canvas2
  class Util
    def self.allocate_id
      @@next_auto_id = 0 if !(defined? @@next_auto_id)
      's' + (@@next_auto_id += 1).to_s
    end

    def self.string_substitute(obj, resolver, helpers = {})
      if obj.nil?
        return ''
      elsif obj.blank?
        return obj
      elsif obj.is_a? String
        return Util.resolve_string(obj, resolver, helpers)
      elsif obj.is_a? Array
        return obj.map {|o| Util.string_substitute(o, resolver, helpers)}
      elsif obj.is_a? Hash
        if obj['substituteType'] == 'array'
          o = Util.string_substitute(obj['value'], resolver, helpers)
          if obj['isJson']
            begin
              o = JSON.parse(o || '[]')
            rescue Exception => e
            end
          else
            o = (o || '').split(obj['split'] || ',')
          end
          o.compact! if obj['compact'] && o.is_a?(Array)
        elsif obj.key?(@@env[:current_locale].to_s)
          o = Util.string_substitute(Util.localize(obj), resolver, helpers)
        else
          o = {}
          obj.each {|k, v| o[k] = Util.string_substitute(v, resolver, helpers)}
        end
        return o
      else
        return obj
      end
    end

    def self.reset
      @@errors = []
      @@page_params = {}
      @@page_vars = {}
      @@request = nil
      @@page_path = nil
      @@debug = nil
      @@no_cache = nil
      @@env = nil
      @@is_private = nil
      @@next_auto_id = 0
    end

    def self.errors
      @@errors
    end

    def self.set_params(params)
      @@page_params = params.reject {|k, v| k == 'controller' || k == 'action' || k == 'path'}
      add_vars(@@page_params)
    end

    def self.page_params
      @@page_params
    end

    def self.set_request(req)
      @@request = req
    end

    def self.request
      @@request
    end

    def self.set_debug(debug)
      @@debug = debug
    end

    def self.debug
      @@debug
    end

    def self.set_no_cache(no_cache)
      @@no_cache = no_cache
    end

    def self.no_cache
      @@no_cache || debug
    end

    def self.set_env(env)
      @@env = env
    end

    def self.env
      @@env
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
      return (defined? @@page_path) ? @@page_path : nil
    end

    def self.is_private(is_p = nil)
      @@is_private = is_p if !is_p.nil?
      @@is_private
    end

    def self.component_data_page(c_id)
      return 1 if @@page_params.nil?
      c_id == @@page_params['data_component'] ? (@@page_params['data_page'] || '1').to_i : 1
    end

    def self.context_options(c_id)
      return nil if @@page_params.nil? || @@page_params['data_context'].nil?
      @@page_params['data_context'][c_id]
    end

    def self.base_resolver
      lambda do |name|
        if name[0] == '?' && defined? @@page_vars
          return deep_get(@@page_vars || {}, name.slice(1, name.length))
        elsif name.start_with?('env.') && defined? @@env
          return deep_get(@@env || {}, name.slice(4, name.length))
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
        if obj.is_a?(Array)
          return nil if !k.match(/^\d+$/)
          k = k.to_i
        end
        begin
          obj = JSON.parse(obj) if obj.is_a?(String)
        rescue Exception => e
        end
        return nil if !obj.is_a?(Enumerable) || obj[k].blank?
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

    def self.csv_escape(str)
      '"' + (str || '').to_s.gsub('"', '""') + '"'
    end

    def self.localize(obj, force_locale = nil)
      return obj if !obj.is_a?(Hash)
      # I18n.locale doesn't seem to be correct here
      locale = force_locale || @@env[:current_locale].to_s
      obj.key?(locale) ? obj[locale] : ''
    end

    # Given an HTML document or snippet, auto-links plain text.
    # Keep this in sync with FormattedText's implementation in formatted-text.js.
    def self.auto_hyperlink_html(html)
      autoLinker = AutoLinker.new
      parser = Nokogiri::HTML::SAX::Parser.new(autoLinker)
      parser.parse(html)
      return autoLinker.output
    end

    #The Sanitizer filter for pre-filtering Markdown documents.
    STRICT_SANITIZE_FILTER =
    {
      :elements => ['span', 'div'],
      :attributes =>
      {
        'span' => ['class'],
        'div' => ['class']
      },
      :protocols => {}
    }

    #The Sanitizer filter for filtering rendered Markdown or other HTML destined
    # for direct display.
    RELAXED_SANITIZE_FILTER = STRICT_SANITIZE_FILTER.deep_merge(
      Sanitize::Config::RELAXED) do |a, b|
        # Also (non-recursively) merge arrays.
        if a.is_a?(Array) && b.is_a?(Array)
          next (a | b)
        else
          next b
        end
      end


    def self.odysseus_request(path, opts = {}, is_anon = false)
      uri = URI::HTTP.build({ host: ODYSSEUS_URI.host, port: ODYSSEUS_URI.port,
                            path: path, query: opts.to_param })
      req = Net::HTTP::Get.new(uri.request_uri)

      req['X-Socrata-Host'] = req['Host'] = CurrentDomain.cname
      req['X-Socrata-Locale'] = @@env[:current_locale].to_s
      req['Cookie'] = Canvas2::Util.request.headers['Cookie'] if !is_anon

      res = Net::HTTP.start(uri.host, uri.port){ |http| http.request(req) }
      raise CoreServer::ResourceNotFound.new(res) if res.is_a?(Net::HTTPNotFound)
      if !res.is_a?(Net::HTTPSuccess)
        raise CoreServer::CoreServerError.new(
          uri.to_s,
          res.code,
          res.body
        )
      end
      JSON.parse(res.body)
    end

  private
    class AppHelper
      include ActionView::Helpers::TagHelper
      include ActionView::Helpers::UrlHelper
      include ActionView::Helpers::NumberHelper
      include ActionView::Helpers::TranslationHelper
      include Singleton
      include ApplicationHelper
    end

    def self.resolve_string(str, resolver, helpers)
      helpers ||= {}

      @@resolve_cache ||= {}
      return do_resolve(@@resolve_cache[str], resolver, helpers) if @@resolve_cache.key?(str)

      m = str.split(/({|})/m)
      props = []
      i = 0
      while i < m.length do
        p = {}
        if m[i] == '{' && m[i + 2] == '}'
          p['orig'] = m[i + 1]
          p['prop'] = p['orig']

          p.merge!(parse_transforms(p['prop']))
          i += 2
        else
          p['orig'] = m[i]
        end
        props << p
        i += 1
      end

      @@resolve_cache[str] = props
      do_resolve(props, resolver, helpers)
    end

    def self.do_resolve(props, resolver, helpers)
      phrases = helpers['phrases'] || {}
      if !resolver.is_a? Proc
        obj = resolver || {}
        resolver = lambda {|name| deep_get(obj, name)}
      end
      return props.map do |p|
        next p['orig'] if p['prop'].blank?

        if !(m = p['prop'].match(/^#(\w+)$/)).nil? && !phrases[m[1]].nil?
          temp = resolve_string(localize(phrases[m[1]]), resolver, helpers)
        else
          temp = resolver.call(p['prop'])
        end

        temp = '' if temp.blank?

        temp = temp.map {|k, v| k + ': ' + v.to_s} if temp.is_a?(Hash)
        temp = temp.join(', ') if temp.is_a?(Array)
        temp = Util.string_substitute(temp, resolver, helpers) if temp.is_a?(String) && !temp.index('{').nil?

        trans_result = process_transforms(temp, p['transforms'], helpers)
        temp = trans_result[:value]
        temp = '{' + p['orig'] + '}' if temp.blank? && !trans_result[:fallback_result]

        temp
      end.join('')
    end

    def self.parse_transforms(str)
      @@transforms_cache ||= {}
      return @@transforms_cache[str] if @@transforms_cache.key?(str)

      p = { 'prop' => str, 'transforms' => [] }

      p['prop'].match(/(^|(.*)\s+)\|\|\s*(.*)$/) do |ma|
        p['prop'] = ma[2] || ''
        p['transforms'].push({
          type: 'fallback',
          fallback: ma[3]
        })
      end

      check_expr = lambda do
        while ma = p['prop'].match(/(^|(.*)\s+)\!(\w+)$/) do
          p['prop'] = ma[2] || ''
          p['transforms'].push({
            type: 'sub_expr',
            key: ma[3]
          })
        end
      end

      check_expr.call()
      while ma = p['prop'].match(/(^|(.*)\s+)\/(([^\s\/]*|(\\\/)*)*)\/(([^\/]*|(\\\/)*)*)\/([gim]*)$/) do
        p['prop'] = ma[2] || ''
        p['transforms'].push({
          type: 'regex',
          regex: ma[3].gsub('\/', '/'),
          repl: ma[6].gsub('\/', '/'),
          modifiers: ma[9]
        })
      end

      check_expr.call()
      while ma = p['prop'].match(/(^|(.*)\s+)([%@$])\[([^\]]*)\]$/) do
        p['prop'] = ma[2] || ''
        t = case ma[3]
            when '%' then 'number_format'
            when '@' then 'date_format'
            when '$' then 'string_format'
            end
        p['transforms'].push({
          type: t,
          format: ma[4]
        })
      end

      check_expr.call()
      p['prop'].match(/(^|(.*)\s+)=\[([^\]]*)\]$/) do |ma|
        p['prop'] = ma[2] || ''
        p['transforms'] << {
          type: 'math_expr',
          expr: ma[3]
        }
      end

      check_expr.call()
      @@transforms_cache[str] = p
      p
    end

    def self.process_transforms(v, transforms, helpers)
      fb_result = false
      transforms.reverse.each do |pt|
        if !@@apply_expr[pt[:type]].blank?
          r = @@apply_expr[pt[:type]].call(v, pt, helpers)
          if !r.is_a?(Hash)
            v = r
          else
            v = r[:value]
            fb_result ||= r[:fallback_result]
          end
        end
      end
      { value: v, fallback_result: fb_result }
    end

    Default_Precison = 2

    @@apply_expr = {
      'regex' => lambda do |v, transf, helpers|
        # Woo, backslash
        repl = transf[:repl].gsub(/\$(\d)/, '\\\\\1')
        r = Regexp.new(transf[:regex],
                       (transf[:modifiers].include?('m') ? Regexp::MULTILINE : 0) |
                       (transf[:modifiers].include?('i') ? Regexp::IGNORECASE : 0))
        v = v.to_s
        transf[:modifiers].include?('g') ? v.gsub(r, repl) : v.sub(r, repl)
      end,

      'number_format' => lambda do |v, transf, helpers|
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

      'date_format' => lambda do |v, transf, helpers|
        d = Util.parse_date(v)
        return v if d.blank?

        fmt = transf[:format].blank? ? "%a %b %e %Y %H:%M:%S GMT%z (%Z)" : transf[:format]
        d.strftime(fmt)
      end,

      'string_format' => lambda do |v, transf, helpers|
        return v if v.blank?

        v = v.strip if transf[:format].include?('t')

        v = v.downcase if transf[:format].include?('l')

        if transf[:format].include?('U')
          v = v.upcase
        elsif transf[:format].include?('u')
          v = v.split(' ').map {|vv| ((vv[0] || '').upcase + (vv[1..-1] || ''))}.join(' ')
        elsif transf[:format].include?('c')
          v = v[0].upcase + v[1, -1]
        end

        if transf[:format].include?('?')
          v = ERB::Util.url_encode(v)
        elsif transf[:format].include?('!') || transf[:format].include?('¿')
          v = CGI::unescape(v)
        end

        v
      end,

      'math_expr' => lambda do |v, transf, helpers|
        var_opts = ['-?x', 't', '-?[0-9]*\\.?[0-9]*']
        op_opts = ['+', '\\-', '*', '\\/', '%']
        transf[:expr].match('^(' + var_opts.join('|') + ')\\s*([' + op_opts.join('') +
                        '])\\s*(' + var_opts.join('|') + ')$') do |m|
          vl = Util.compute_value(m[1], v)
          vr = Util.compute_value(m[3], v)

          return v if vl.blank? || vr.blank?

          v =
            case m[2]
              when '+' then vl + vr
              when '-' then vl - vr
              when '*' then vl * vr
              when '/' then vl / vr
              when '%' then vl % vr
            end
        end
        v
      end,

      'sub_expr' => lambda do |v, transf, helpers|
        process_transforms(v, parse_transforms(localize((helpers['expressions'] || {})[transf[:key]]))['transforms'], helpers)
      end,

      'fallback' => lambda do |v, transf, helpers|
        is_fb = v.blank?
        { value: is_fb ? transf[:fallback] : v, fallback_result: is_fb }
      end
    }

    def self.parse_date(v)
      if v.is_a?(Numeric)
        return Time.at(v)
      elsif v.is_a?(String)
        begin
          # Seriously, fuck you, Ruby
          v = "#{$3}-#{$1}-#{$2}" if /(\d{1,2})[\-.\/](\d{1,2})[\-.\/](\d{4})/ =~ v
          return Time.parse(v)
        rescue ArgumentError => e
        end
      end
      nil
    end

    def self.compute_value(str, v)
      case str
        when 'x' then Float(v) rescue nil
        when '-x' then -Float(v) rescue nil
        when 't' then
          d = Util.parse_date(v)
          d.blank? ? nil : d.to_i
        else Float(str).to_f
      end
    end

  end
end
