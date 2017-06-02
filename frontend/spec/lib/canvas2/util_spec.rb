require 'rails_helper'

describe Canvas2::Util do
  include TestHelperMethods

  before do
    init_current_domain
    Canvas2::Util.set_request(nil)

    @input = nil
    invalidate_transforms_cache!
  end

  describe '#parse_transforms' do
    describe 'sub-expressions' do
      it 'will parse' do
        @input = 'foo.bar !my_sub_expr'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar')
        expect(transforms).to eq([
          { type: 'sub_expr', key: 'my_sub_expr' }
        ])
      end
    end

    describe 'fallbacks' do
      it 'will parse' do
        @input = 'foo.bar || my_fallback'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar')
        expect(transforms).to eq([
          { type: 'fallback', fallback: 'my_fallback' }
        ])
      end

      # Uh...
      it 'may be empty' do
        @input = 'foo.bar ||'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar')
        expect(transforms).to eq([
          { type: 'fallback', fallback: '' }
        ])
      end

      # Unintended behavior discovered when original tests were written.
      # Instead of risking a breaking change by fixing it, it was documented by writing a test.
      it 'will parse badly when repeated' do
        @input = 'foo.bar || my_fallback || my_other_fallback'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar || my_fallback') # whoops!
        expect(transforms).to eq([
          { type: 'fallback', fallback: 'my_other_fallback' }
        ])
      end
    end

    describe 'regular expressions' do
      it 'will parse' do
        @input = 'foo.bar /find/replace/g'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar')
        expect(transforms).to eq([
          { type: 'regex', regex: 'find', repl: 'replace', modifiers: 'g' }
        ])
      end

      it 'may have multiple' do
        @input = 'foo.bar /one/ONE/ /two/TWO/g /three//'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar')
        expect(transforms).to eq([
          { type: 'regex', regex: 'three', repl: '', modifiers: '' },
          { type: 'regex', regex: 'two', repl: 'TWO', modifiers: 'g' },
          { type: 'regex', regex: 'one', repl: 'ONE', modifiers: '' }
        ])
      end

      it 'can handle escape slashes' do
        @input = 'foo.bar /\/1\/2\//\/3\/4\//'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar')
        expect(transforms).to eq([
          { type: 'regex', regex: '/1/2/', repl: '/3/4/', modifiers: '' }
        ])
      end
    end

    describe 'formatters' do
      it 'supports strings' do
        @input = 'foo.bar $[my_format]'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar')
        expect(transforms).to eq([
          { type: 'string_format', format: 'my_format' }
        ])
      end

      it 'supports numbers' do
        @input = 'foo.bar %[my_format]'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar')
        expect(transforms).to eq([
          { type: 'number_format', format: 'my_format' }
        ])
      end

      it 'supports dates' do
        @input = 'foo.bar @[my_format]'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar')
        expect(transforms).to eq([
          { type: 'date_format', format: 'my_format' }
        ])
      end

      it 'supports math' do
        @input = 'foo.bar =[my_format]'
        prop, transforms = subject.values_at('prop', 'transforms')
        expect(prop).to eq('foo.bar')
        expect(transforms).to eq([
          { type: 'math_expr', expr: 'my_format' }
        ])
      end
    end

    it 'works with combinations' do
      @input = 'foo.bar !my_sub_expr /hello/HELLO/ /world//g !my_other_sub_expr || my_fallback'
      prop, transforms = subject.values_at('prop', 'transforms')
      expect(prop).to eq('foo.bar')
      expect(transforms).to eq([
        { type: 'fallback', fallback: 'my_fallback' },
        { type: 'sub_expr', key: 'my_other_sub_expr' },
        { type: 'regex', regex: 'world', repl: '', modifiers: 'g' },
        { type: 'regex', regex: 'hello', repl: 'HELLO', modifiers: '' },
        { type: 'sub_expr', key: 'my_sub_expr' }
      ])

      @input = 'foo.bar =[mathy] %[numberful] $[stringly] @[dateish] /one/two/g || my_fallback'
      prop, transforms = subject.values_at('prop', 'transforms')
      expect(prop).to eq('foo.bar')
      expect(transforms).to eq([
        { type: 'fallback', fallback: 'my_fallback' },
        { type: 'regex', regex: 'one', repl: 'two', modifiers: 'g' },
        { type: 'date_format', format: 'dateish' },
        { type: 'string_format', format: 'stringly' },
        { type: 'number_format', format: 'numberful' },
        { type: 'math_expr', expr: 'mathy' }
      ])
    end

    it 'handles the empty string' do
      @input = ''
      prop, transforms = subject.values_at('prop', 'transforms')
      expect(prop).to eq('')
      expect(transforms).to be_empty
    end

    # NOTE: this breaks when you take away the surrounding spaces.
    # Super super sketchy.
    it 'applies no transforms to CSS strings' do
      @input = ' background-image: none !important '
      prop, transforms = subject.values_at('prop', 'transforms')
      expect(prop).to eq(' background-image: none !important ')
      expect(transforms).to be_empty
    end

    # I have copied this section over from the old Minitest examples.
    # The relevant section of code for this test has the comment
    # "MWAHAHAHAHHAHAHAHAHAAHAHA" which means it will probably be
    # utter hell to figure out and port over. Therefore, skip.

    # def test_known_infinite_loop
    #   # agtj-bhhn.3.0
    #   fixed_assert_raises(Timeout::Error, fixed: true) do
    #     parsed_result = Canvas2::Util.parse_transforms(' /Northshore%20S_D_%20No_%20417/Northshore%20School%20District%20No_%20417%20Proposition%20No_%202%20General%20Obligation%20Bonds%20-%20%24177%2C500%2C000 ')
    #     assert parsed_result['transforms'].empty?
    #   end

    #   # enei-9eai.0.18
    #   # fhdy-ykrf.0.96
    #   # r3t4-u8fj.0.96
    #   fixed_assert_raises(Timeout::Error, fixed: true) do
    #     parsed_result = Canvas2::Util.parse_transforms(%q{ // Do some manual magic on our location column (this is a column I created from the original camp column) // long/lat in Socrata is formatted as a string of: (long, lat) // we want to switch it to an array of type: [long, lat] camp = d['RELOCATION PROJECT LOCATION']; camps = camp.split(', '); camps[0] = camps[0].replace('(', ''); camps[1] = camps[1].replace(')', ''); d.campLoc = camps; })
    #     assert parsed_result['transforms'].empty?
    #   end
    # end

    # def fixed_assert_raises(error_klass, fixed = {}, &block)
    #   if fixed[:fixed]
    #     block.call
    #   else
    #     assert_raises(error_klass, &block)
    #   end
    # end
  end

  private

  # private method instead of let, to avoid memoizing
  def subject
    Canvas2::Util.parse_transforms(@input)
  end

  def invalidate_transforms_cache!
    Canvas2::Util.class_variable_set(:@@transforms_cache, {})
  end
end
