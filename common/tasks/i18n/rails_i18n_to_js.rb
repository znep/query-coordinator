require 'parser/current'
require 'byebug'

# The design of this processor is such that it's specifically designed to understand the
# contents of the RailsI18n gem at the time I wrote it. If a significant refactor occurs,
# then this file will not continue to be compatible and there'd have to be significant
# work done to update it appropriately.
#
# Fortunately, such a possibility feels fairly unlikely.
#
# This strategy, ultimately, is why there remain certain transpiling failures, and why
# new failures are likely to crop up. Sorry.
#
# Known Problems:
# Breton (br) - Concatenating multiple ranges and testing inclusion in the result.
# Welsh (cy) - Handling case/when statements.
# Polish (pl), Tamazight (tzm) - Testing inclusion in an array added to a range.
module RailsI18nToJS
  KNOWN_TRANSPILING_FAILURES = %w(br cy pl tzm)

  LAST_KNOWN_WORKING_VER = Gem::Version.new('5.0.4')

  PREAMBLE = <<~JS
    import _ from 'lodash';
    const inRange = (begin, end, count) => { return _.includes(_.range(begin, end).concat(end), count); };
    const todo = () => { throw new Error('Need to implement this pluralization rule.'); };
  JS

  GEM_DIR = Gem::Specification.find_all.find { |s| s.name == 'rails-i18n' }.tap do |spec|
    raise "Please run `gem install rails-i18n` in this context." if spec.nil?

    if Gem::Version.new(spec.version) > LAST_KNOWN_WORKING_VER
      raise "Warning: this script was last known to work with rails-i18n #{LAST_KNOWN_WORKING_VER}, but rails-i18n #{spec.version} was detected."\
            " please update 'LAST_KNOWN_WORKING_VER' to #{spec.version}, run again, and see if the pluralization output still makes sense."
    end
  end.gem_dir

  def self.run(io = $stdout)
    io.puts PREAMBLE

    CommonPluralizationRule.list.map do |full_path|
      name, data = Parser.parse(full_path)
      CommonPluralizationRule[name] = data.flatten.join
    end

    io.puts 'const commonPluralizationRules = {'
    io.puts CommonPluralizationRule.map { |name, rule| "  #{name}: #{rule}" }.join(",\n")
    io.puts '};'

    PluralizationRule.list.map do |full_path|
      name, data = Parser.parse(full_path)
      PluralizationRule[name] = case data
                                  when Array then data.flatten.join
                                  when String then "commonPluralizationRules.#{data}"
                                end
    end

    check = lambda { |name| KNOWN_TRANSPILING_FAILURES.include?(name) && 'todo' }

    io.puts 'const pluralizationRules = {'
    io.puts PluralizationRule.map { |name, rule| "  '#{name}': #{check.call(name) || rule}" }.join(",\n")
    io.puts '};'

    io.puts 'export default pluralizationRules;'
  end

  class PluralizationRule
    extend Enumerable

    def self.directory
      '/rails/pluralization/'
    end

    def self.list
      Dir.entries(File.join(GEM_DIR, directory)).
        select { |file| file.end_with?('.rb') }.
        map { |path| File.join(GEM_DIR, directory, path) }
    end

    def self.[](key)
      (@data ||= {})[key]
    end

    def self.[]=(key, other)
      (@data ||= {})[key] = other
    end

    def self.each(*args, &block)
      @data.each(*args, &block)
    end
  end

  class CommonPluralizationRule < PluralizationRule
    def self.directory
      '/lib/rails_i18n/common_pluralizations/'
    end
  end

  module Parser
    class << self
      def parse_or_asgn(node)
        left, right = node.children.map(&:children).map(&:last)
        "if (!#{left}) { #{left} = #{right}; }"
      end

      # There's an argument to be made for using `let` instead, but until there's a need for
      # mutation, `const` it is.
      def parse_lvasgn(node)
        name = node.children.first
        "const #{name} = #{parse_node(node.children.last)};"
      end

      def parse_array(node)
        "[#{node.children.map(&:children).map(&:last).join(', ')}]"
      end

      # This is the primary case in which we do some terrible and non-backwards-compatible hackery.
      # Subtle things are entirely capable of breaking as a result of doing stuff like this.
      def parse_include(node, for_recursion = nil)
        case node.children.first.type
        when :send, :begin
          parse_include(node.children.first, for_recursion || node.children.last)
        when :irange
          "inRange(#{node.children.first.children.map(&method(:parse_node)).join(', ')}, #{parse_node(for_recursion)})"
        when :const
          "inRange(#{@constants[parse_const(node.children.first)].join(', ')}, #{parse_node(node.children.last)})"
        when :array
          "_.includes(#{parse_array(node.children.first)}, #{parse_node(node.children.last)})"
        end
      end

      def parse_send(node)
        case node.children[1]
        when :%
          [ node.children.first, node.children.last ].map(&method(:parse_node)).join(' % ')
        when :==
          [ node.children.first, node.children.last ].map(&method(:parse_node)).join(' === ')
        when :!=
          [ node.children.first, node.children.last ].map(&method(:parse_node)).join(' !== ')
        when :!
          "!#{parse_node(node.children.first)}"
        when :>=
          [ node.children.first, node.children.last ].map(&method(:parse_node)).join(' >= ')
        when :<
          [ node.children.first, node.children.last ].map(&method(:parse_node)).join(' < ')
        when :>
          [ node.children.first, node.children.last ].map(&method(:parse_node)).join(' > ')
        when :send
          parse_send(node.children.first)
        when :include?
          parse_include(node)
        when :new
          # Ignoring Proc.new
        else
          node.children.first
        end
      end

      def parse_if(node)
        children = node.children.dup
        condition = children.shift
        [ "if (#{parse_node(condition)}) {",
          parse_node(children.shift),
          '}'
        ].tap do |return_value|
          next if children.empty?
          case children.first.type
          when :if then return_value << parse_if(children.shift)
          when :sym then return_value << parse_node(children.shift)
          end
        end
      end

      def parse_node(node)
        case node.type
          when :begin then node.children.map(&method(:parse_node))
          when :send then parse_send(node)
          when :or_asgn then parse_or_asgn(node)
          when :lvasgn then parse_lvasgn(node)
          when :if then parse_if(node)
          when :sym then "return ['#{node.children.last}'];"
          when :lvar, :int then node.children.last
          when :or then node.children.map(&method(:parse_node)).join(' || ')
          when :and then node.children.map(&method(:parse_node)).join(' && ')
        end
      end

      def parse_const(node)
        node.children.last
      end

      def parse(full_path)
        ast = ::Parser::CurrentRuby.parse(File.read(full_path))

        if ast.type == :begin && ast.children.last.type == :send
          # In this case, there is no rule defined and we need to go find which general one to use.

          ast = ast.children.last # Grab the #send(:with_locale, :locale)
          const_tree, _, locale = ast.children # self, :with_locale, :sym
          class_name_sym = const_tree.children.last # Grab the name.

          specific_pluralization_name = full_path.split('/').last[0...-3]

          general_pluralization_name = camelize_class_name(class_name_sym)
          return [ specific_pluralization_name, general_pluralization_name ]
        end

        # Needed for specific pluralizations for some reason.
        ast = ast.children.first if ast.type == :begin

        # Dig through the module layers.
        class_name_sym, ast = ast.children while ast.type == :module

        rule =
          if ast.type == :defs
            ast.children.last
          else
            # Pull out the constants. Sigh.
            @constants = ast.children.select { |node| node.type == :casgn }.map do |node|
              name = node.children[1]
              irange_node = node.children.last.children.first.children.first.children.first
              args = irange_node.children.map(&:children).map(&:last)
              [ name, args ]
            end.to_h

            # Find `def self.rule`
            ast.children.select { |node| node.type == :defs }.find { |node| node.children[1] == :rule }.children.last
          end

        arguments = rule.children[1].children.first
        arg_name = arguments.children.first if arguments.respond_to?(:children)

        use_general_plural = full_path.include?(CommonPluralizationRule.directory)

        general_pluralization_name = camelize_class_name(parse_const(class_name_sym))
        specific_pluralization_name = full_path.split('/').last[0...-3].downcase.sub('-', '_')

        [ use_general_plural ? general_pluralization_name : specific_pluralization_name,
          [ "(#{arg_name}) => {",
            rule.children.map { |node| parse_node(node) },
            "}"
          ]
        ]
      end

      def camelize_class_name(class_name)
        class_name.to_s.dup.tap { |x| x[0] = x[0].downcase }
      end
    end
  end
end

RailsI18nToJS.run if __FILE__ == $0
