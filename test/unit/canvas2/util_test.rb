require_relative '../../test_helper'

class Canvas2UtilTest < Test::Unit::TestCase

  def setup
    init_current_domain
    Canvas2::Util.set_request nil

    invalidate_transforms_cache!
  end

  def test_fallback
    parsed_result = Canvas2::Util.parse_transforms('foo.bar || fallback')
    assert_transform_is_a parsed_result, 'fallback'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:fallback] == 'fallback'

    parsed_result = Canvas2::Util.parse_transforms('foo.bar ||squished')
    assert_transform_is_a parsed_result, 'fallback'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:fallback] == 'squished'
  end

  # This probably isn't intended behavior.
  # This was existing edge case behavior when the tests were written, but I doubt it's desirable.
  def test_complex_fallback_ignored
    parsed_result = Canvas2::Util.parse_transforms('foo.bar || fallback || fallback2')
    assert_transform_is_a parsed_result, 'fallback'
    assert parsed_result['prop'] == 'foo.bar || fallback'
    assert parsed_result['transforms'].first[:fallback] == 'fallback2'
  end

  def test_empty_fallback
    parsed_result = Canvas2::Util.parse_transforms('foo.bar ||')
    assert_transform_is_a parsed_result, 'fallback'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:fallback] == ''
  end

  # This probably isn't intended behavior.
  # I don't even know how to write a test for this...
  def x_test_crazy_javascript_fallback
    correct = {"prop"=>"        (document.getElementsByTagName('head')[0]", "transforms"=>[{:type=>"fallback", :fallback=>"document.getElementsByTagName('body')[0]).appendChild(dsq);"}]}
    incorrect = {"prop"=>"var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true; dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js'; (document.getElementsByTagName('head')[0]", "transforms"=>[{:type=>"fallback", :fallback=>"document.getElementsByTagName('body')[0]).appendChild(dsq);"}]}
  end

  def test_sub_expr
    parsed_result = Canvas2::Util.parse_transforms('foo.bar !sub_expr')
    assert_transform_is_a parsed_result, 'sub_expr'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:key] == 'sub_expr'
  end

  def test_sub_expr_with_fallback
    parsed_result = Canvas2::Util.parse_transforms('foo.bar !sub_expr || fallback')
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'][0][:type] == 'fallback'
    assert parsed_result['transforms'][0][:fallback] == 'fallback'
    assert parsed_result['transforms'][1][:type] == 'sub_expr'
    assert parsed_result['transforms'][1][:key] == 'sub_expr'
  end

  def test_regex
    parsed_result = Canvas2::Util.parse_transforms('foo.bar /find/replace/g')
    assert_transform_is_a parsed_result, 'regex'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:regex] == 'find'
    assert parsed_result['transforms'].first[:repl] == 'replace'
    assert parsed_result['transforms'].first[:modifiers] == 'g'
  end

  def test_multiple_regexes
    parsed_result = Canvas2::Util.parse_transforms('foo.bar /one/ONE/ /two/TWO/ /three/THREE/')
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'][0][:regex] == 'three'
    assert parsed_result['transforms'][0][:repl] == 'THREE'
    assert parsed_result['transforms'][0][:modifiers] == ''
    assert parsed_result['transforms'][1][:regex] == 'two'
    assert parsed_result['transforms'][1][:repl] == 'TWO'
    assert parsed_result['transforms'][1][:modifiers] == ''
    assert parsed_result['transforms'][2][:regex] == 'one'
    assert parsed_result['transforms'][2][:repl] == 'ONE'
    assert parsed_result['transforms'][2][:modifiers] == ''
  end

  def test_multiple_regexes_with_sub_expr
    parsed_result = Canvas2::Util.parse_transforms('foo.bar !sub_expr /one/ONE/ /two/TWO/')
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'][0][:type] == 'regex'
    assert parsed_result['transforms'][0][:regex] == 'two'
    assert parsed_result['transforms'][0][:repl] == 'TWO'
    assert parsed_result['transforms'][0][:modifiers] == ''
    assert parsed_result['transforms'][1][:type] == 'regex'
    assert parsed_result['transforms'][1][:regex] == 'one'
    assert parsed_result['transforms'][1][:repl] == 'ONE'
    assert parsed_result['transforms'][1][:modifiers] == ''
    assert parsed_result['transforms'][2][:type] == 'sub_expr'
    assert parsed_result['transforms'][2][:key] == 'sub_expr'
  end

  def test_multiple_regexes_with_sub_expr_with_fallback
    parsed_result = Canvas2::Util.parse_transforms('foo.bar !sub_expr /one/ONE/ /two/TWO/ || fallback')
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'][0][:type] == 'fallback'
    assert parsed_result['transforms'][0][:fallback] == 'fallback'
    assert parsed_result['transforms'][1][:type] == 'regex'
    assert parsed_result['transforms'][1][:regex] == 'two'
    assert parsed_result['transforms'][1][:repl] == 'TWO'
    assert parsed_result['transforms'][1][:modifiers] == ''
    assert parsed_result['transforms'][2][:type] == 'regex'
    assert parsed_result['transforms'][2][:regex] == 'one'
    assert parsed_result['transforms'][2][:repl] == 'ONE'
    assert parsed_result['transforms'][2][:modifiers] == ''
    assert parsed_result['transforms'][3][:type] == 'sub_expr'
    assert parsed_result['transforms'][3][:key] == 'sub_expr'
  end

  def test_multiple_regexes_with_two_sub_exprs_with_fallback
    parsed_result = Canvas2::Util.parse_transforms('foo.bar !sub_expr /one/ONE/ /two/TWO/ !sub_expr2 || fallback')
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'][0][:type] == 'fallback'
    assert parsed_result['transforms'][0][:fallback] == 'fallback'
    assert parsed_result['transforms'][1][:type] == 'sub_expr'
    assert parsed_result['transforms'][1][:key] == 'sub_expr2'
    assert parsed_result['transforms'][2][:type] == 'regex'
    assert parsed_result['transforms'][2][:regex] == 'two'
    assert parsed_result['transforms'][2][:repl] == 'TWO'
    assert parsed_result['transforms'][2][:modifiers] == ''
    assert parsed_result['transforms'][3][:type] == 'regex'
    assert parsed_result['transforms'][3][:regex] == 'one'
    assert parsed_result['transforms'][3][:repl] == 'ONE'
    assert parsed_result['transforms'][3][:modifiers] == ''
    assert parsed_result['transforms'][4][:type] == 'sub_expr'
    assert parsed_result['transforms'][4][:key] == 'sub_expr'
  end

  def test_regex_replacing_with_empty_string
    parsed_result = Canvas2::Util.parse_transforms('foo.bar /find//')
    assert_transform_is_a parsed_result, 'regex'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:regex] == 'find'
    assert parsed_result['transforms'].first[:repl] == ''
    assert parsed_result['transforms'].first[:modifiers] == ''
  end

  def test_regex_with_escaped_slashes
    parsed_result = Canvas2::Util.parse_transforms('foo.bar /\//\//g')
    assert_transform_is_a parsed_result, 'regex'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:regex] == '/'
    assert parsed_result['transforms'].first[:repl] == '/'
    assert parsed_result['transforms'].first[:modifiers] == 'g'

    parsed_result = Canvas2::Util.parse_transforms('foo.bar /before\//before\//g')
    assert_transform_is_a parsed_result, 'regex'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:regex] == 'before/'
    assert parsed_result['transforms'].first[:repl] == 'before/'
    assert parsed_result['transforms'].first[:modifiers] == 'g'

    parsed_result = Canvas2::Util.parse_transforms('foo.bar /\/after/\/after/g')
    assert_transform_is_a parsed_result, 'regex'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:regex] == '/after'
    assert parsed_result['transforms'].first[:repl] == '/after'
    assert parsed_result['transforms'].first[:modifiers] == 'g'

    parsed_result = Canvas2::Util.parse_transforms('foo.bar /be\/tween/be\/tween/g')
    assert_transform_is_a parsed_result, 'regex'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:regex] == 'be/tween'
    assert parsed_result['transforms'].first[:repl] == 'be/tween'
    assert parsed_result['transforms'].first[:modifiers] == 'g'
  end

  def test_number_format
    parsed_result = Canvas2::Util.parse_transforms('foo.bar %[format]')
    assert_transform_is_a parsed_result, 'number_format'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:format] == 'format'
  end

  def test_date_format
    parsed_result = Canvas2::Util.parse_transforms('foo.bar @[format]')
    assert_transform_is_a parsed_result, 'date_format'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:format] == 'format'
  end

  def test_string_format
    parsed_result = Canvas2::Util.parse_transforms('foo.bar $[format]')
    assert_transform_is_a parsed_result, 'string_format'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:format] == 'format'
  end

  def test_math_expr
    parsed_result = Canvas2::Util.parse_transforms('foo.bar =[math_expr]')
    assert_transform_is_a parsed_result, 'math_expr'
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].first[:expr] == 'math_expr'
  end

  def test_insanity
    parsed_result = Canvas2::Util.parse_transforms('foo.bar =[math_expr] %[num_format] $[str_format] /one/two/g /life/death/i /hope/despair/m || blargh')
    assert parsed_result['prop'] == 'foo.bar'
    assert parsed_result['transforms'].length == 7
    assert parsed_result['transforms'][0][:type] == 'fallback'
    assert parsed_result['transforms'][0][:fallback] == 'blargh'
    assert parsed_result['transforms'][1][:type] == 'regex'
    assert parsed_result['transforms'][1][:regex] == 'hope'
    assert parsed_result['transforms'][1][:repl] == 'despair'
    assert parsed_result['transforms'][1][:modifiers] == 'm'
    assert parsed_result['transforms'][2][:type] == 'regex'
    assert parsed_result['transforms'][2][:regex] == 'life'
    assert parsed_result['transforms'][2][:repl] == 'death'
    assert parsed_result['transforms'][2][:modifiers] == 'i'
    assert parsed_result['transforms'][3][:type] == 'regex'
    assert parsed_result['transforms'][3][:regex] == 'one'
    assert parsed_result['transforms'][3][:repl] == 'two'
    assert parsed_result['transforms'][3][:modifiers] == 'g'
    assert parsed_result['transforms'][4][:type] == 'string_format'
    assert parsed_result['transforms'][4][:format] == 'str_format'
    assert parsed_result['transforms'][5][:type] == 'number_format'
    assert parsed_result['transforms'][5][:format] == 'num_format'
    assert parsed_result['transforms'][6][:type] == 'math_expr'
    assert parsed_result['transforms'][6][:expr] == 'math_expr'
  end

  def test_empty
    parsed_result = Canvas2::Util.parse_transforms('')
    assert parsed_result['prop'] == ''
    assert parsed_result['transforms'].empty?
  end

  def test_evil_css
    parsed_result = Canvas2::Util.parse_transforms('filter: none !important;')
    assert parsed_result['prop'] == 'filter: none !important;'
    assert parsed_result['transforms'].empty?
  end

  def test_formatting_when_no_transforms
    parsed_result = Canvas2::Util.parse_transforms('     filter: none !important;     ')
    assert parsed_result['prop'] == '     filter: none !important;     '
    assert parsed_result['transforms'].empty?
  end

  def test_evil_css_2
    parsed_result = Canvas2::Util.parse_transforms(' background-image: none !important ')
    assert parsed_result['prop'] == ' background-image: none !important '
    assert parsed_result['transforms'].empty?
  end

  def test_date_format_that_looks_like_regex
    parsed_result = Canvas2::Util.parse_transforms('foo @[%m/%d/%Y]')
    assert_transform_is_a parsed_result, 'date_format'
    assert parsed_result['prop'] == 'foo'
    assert parsed_result['transforms'].first[:format] == '%m/%d/%Y'
  end

  def test_regex_with_a_space
    parsed_result = Canvas2::Util.parse_transforms('?category /-/ /g ||')
    assert parsed_result['prop'] == '?category'
    assert parsed_result['transforms'][0][:type] == 'fallback'
    assert parsed_result['transforms'][0][:fallback] == ''
    assert parsed_result['transforms'][1][:type] == 'regex'
    assert parsed_result['transforms'][1][:regex] == '-'
    assert parsed_result['transforms'][1][:repl] == ' '
    assert parsed_result['transforms'][1][:modifiers] == 'g'
  end

  def test_date_format_with_a_space
    parsed_result = Canvas2::Util.parse_transforms('final_date_for_placing_loans_under_coverage @[%d %b %Y]')
    assert_transform_is_a parsed_result, 'date_format'
    assert parsed_result['prop'] == 'final_date_for_placing_loans_under_coverage'
    assert parsed_result['transforms'].first[:format] = '%d %b %Y'
  end

  def test_math_expr_with_a_space
    parsed_result = Canvas2::Util.parse_transforms('meter_value =[x * 1.8]')
    assert_transform_is_a parsed_result, 'math_expr'
    assert parsed_result['prop'] == 'meter_value'
    assert parsed_result['transforms'].first[:format] = 'x * 1.8'
  end

  def test_known_infinite_loop
    # agtj-bhhn.3.0
    fixed_assert_raises(TimeoutError, fixed: true) do
      parsed_result = Canvas2::Util.parse_transforms(' /Northshore%20S_D_%20No_%20417/Northshore%20School%20District%20No_%20417%20Proposition%20No_%202%20General%20Obligation%20Bonds%20-%20%24177%2C500%2C000 ')
      assert parsed_result['transforms'].empty?
    end

    # enei-9eai.0.18
    # fhdy-ykrf.0.96
    # r3t4-u8fj.0.96
    fixed_assert_raises(TimeoutError, fixed: true) do
      parsed_result = Canvas2::Util.parse_transforms(%q{ // Do some manual magic on our location column (this is a column I created from the original camp column) // long/lat in Socrata is formatted as a string of: (long, lat) // we want to switch it to an array of type: [long, lat] camp = d['RELOCATION PROJECT LOCATION']; camps = camp.split(', '); camps[0] = camps[0].replace('(', ''); camps[1] = camps[1].replace(')', ''); d.campLoc = camps; })
      assert parsed_result['transforms'].empty?
    end
  end

  def test_with_substitution_helpers
    parsed_result = Canvas2::Util.parse_transforms('env.current_locale !default_locale !add_slash ||')
    substitution_helpers = { 'expressions' => {
        'add_slash' => '/(.+)/\\/$1/',
        'default_locale' => '/ca//'
      }
    }
    parsed_add_slash = Canvas2::Util.parse_transforms(substitution_helpers['expressions']['add_slash'])
    assert_transform_is_a parsed_add_slash, 'regex'
    assert parsed_add_slash['transforms'].first[:regex] == '(.+)'
    assert parsed_add_slash['transforms'].first[:repl] == '/$1'
    assert parsed_add_slash['transforms'].first[:modifiers] == ''

    processed_result = Canvas2::Util.process_transforms('en',
                                                        parsed_result['transforms'],
                                                        substitution_helpers)
    assert processed_result[:value] == '/en'
    refute processed_result[:fallback_result]
  end

  private
  def assert_transform_is_a(parsed_result, type)
    assert parsed_result['transforms'].present?
    assert parsed_result['transforms'].length == 1
    assert parsed_result['transforms'].first[:type] == type.to_s
  end

  # Built because I'd like to be able to record expected behavior for the infnite loops,
  # but since they're fixed they no longer demonstrate the exception.
  def fixed_assert_raises(error_klass, fixed = {}, &block)
    if fixed[:fixed]
      block.call
    else
      assert_raises(error_klass, &block)
    end
  end

  def invalidate_transforms_cache!
    Canvas2::Util.class_variable_set :@@transforms_cache, {}
  end
end
