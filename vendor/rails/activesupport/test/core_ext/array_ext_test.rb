require 'abstract_unit'
require 'bigdecimal'

class ArrayExtAccessTests < Test::Unit::TestCase
  def test_from
    assert_equal %w( a b c d ), %w( a b c d ).from(0)
    assert_equal %w( c d ), %w( a b c d ).from(2)
    assert_nil %w( a b c d ).from(10)
  end

  def test_to
    assert_equal %w( a ), %w( a b c d ).to(0)
    assert_equal %w( a b c ), %w( a b c d ).to(2)
    assert_equal %w( a b c d ), %w( a b c d ).to(10)
  end
  
  def test_second_through_tenth
    array = (1..42).to_a
    
    assert_equal array[1], array.second
    assert_equal array[2], array.third
    assert_equal array[3], array.fourth
    assert_equal array[4], array.fifth
    assert_equal array[41], array.fourty_two
  end
end

class ArrayExtToParamTests < Test::Unit::TestCase
  class ToParam < String
    def to_param
      "#{self}1"
    end
  end

  def test_string_array
    assert_equal '', %w().to_param
    assert_equal 'hello/world', %w(hello world).to_param
    assert_equal 'hello/10', %w(hello 10).to_param
  end

  def test_number_array
    assert_equal '10/20', [10, 20].to_param
  end

  def test_to_param_array
    assert_equal 'custom1/param1', [ToParam.new('custom'), ToParam.new('param')].to_param
  end
end

class ArrayExtToSentenceTests < Test::Unit::TestCase
  def test_plain_array_to_sentence
    assert_equal "", [].to_sentence
    assert_equal "one", ['one'].to_sentence
    assert_equal "one and two", ['one', 'two'].to_sentence
    assert_equal "one, two, and three", ['one', 'two', 'three'].to_sentence
  end

  def test_to_sentence_with_connector
    assert_equal "one, two, and also three", ['one', 'two', 'three'].to_sentence(:connector => 'and also')
    assert_equal "one, two, three", ['one', 'two', 'three'].to_sentence(:connector => '')
    assert_equal "one, two, three", ['one', 'two', 'three'].to_sentence(:connector => nil)
    assert_equal "one, two,  three", ['one', 'two', 'three'].to_sentence(:connector => ' ')
    assert_equal "one, two, and  three", ['one', 'two', 'three'].to_sentence(:connector => 'and ')
  end

  def test_to_sentence_with_skip_last_comma
    assert_equal "one, two, and three", ['one', 'two', 'three'].to_sentence(:skip_last_comma => false)
  end

  def test_two_elements
    assert_equal "one and two", ['one', 'two'].to_sentence
    assert_equal "one two", ['one', 'two'].to_sentence(:connector => '')
  end

  def test_one_element
    assert_equal "one", ['one'].to_sentence
  end

  def test_one_non_string_element
    assert_equal '1', [1].to_sentence
  end
end

class ArrayExtToSTests < Test::Unit::TestCase
  def test_to_s_db
    collection = [
      Class.new { def id() 1 end }.new,
      Class.new { def id() 2 end }.new,
      Class.new { def id() 3 end }.new
    ]

    assert_equal "null", [].to_s(:db)
    assert_equal "1,2,3", collection.to_s(:db)
  end
end

class ArrayExtGroupingTests < Test::Unit::TestCase
  def test_in_groups_of_with_perfect_fit
    groups = []
    ('a'..'i').to_a.in_groups_of(3) do |group|
      groups << group
    end

    assert_equal [%w(a b c), %w(d e f), %w(g h i)], groups
    assert_equal [%w(a b c), %w(d e f), %w(g h i)], ('a'..'i').to_a.in_groups_of(3)
  end

  def test_in_groups_of_with_padding
    groups = []
    ('a'..'g').to_a.in_groups_of(3) do |group|
      groups << group
    end

    assert_equal [%w(a b c), %w(d e f), ['g', nil, nil]], groups
  end

  def test_in_groups_of_pads_with_specified_values
    groups = []

    ('a'..'g').to_a.in_groups_of(3, 'foo') do |group|
      groups << group
    end

    assert_equal [%w(a b c), %w(d e f), ['g', 'foo', 'foo']], groups
  end

  def test_in_groups_of_without_padding
    groups = []

    ('a'..'g').to_a.in_groups_of(3, false) do |group|
      groups << group
    end

    assert_equal [%w(a b c), %w(d e f), ['g']], groups
  end

  def test_in_groups_returned_array_size
    array = (1..7).to_a

    1.upto(array.size + 1) do |number|
      assert_equal number, array.in_groups(number).size
    end
  end

  def test_in_groups_with_empty_array
    assert_equal [[], [], []], [].in_groups(3)
  end

  def test_in_groups_with_block
    array = (1..9).to_a
    groups = []

    array.in_groups(3) do |group|
      groups << group
    end

    assert_equal array.in_groups(3), groups
  end

  def test_in_groups_with_perfect_fit
    assert_equal [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
      (1..9).to_a.in_groups(3)
  end

  def test_in_groups_with_padding
    array = (1..7).to_a

    assert_equal [[1, 2, 3], [4, 5, nil], [6, 7, nil]],
      array.in_groups(3)
    assert_equal [[1, 2, 3], [4, 5, 'foo'], [6, 7, 'foo']],
      array.in_groups(3, 'foo')
  end

  def test_in_groups_without_padding
    assert_equal [[1, 2, 3], [4, 5], [6, 7]],
      (1..7).to_a.in_groups(3, false)
  end
end

class ArraySplitTests < Test::Unit::TestCase
  def test_split_with_empty_array
    assert_equal [[]], [].split(0)
  end

  def test_split_with_argument
    assert_equal [[1, 2], [4, 5]],  [1, 2, 3, 4, 5].split(3)
    assert_equal [[1, 2, 3, 4, 5]], [1, 2, 3, 4, 5].split(0)
  end

  def test_split_with_block
    assert_equal [[1, 2], [4, 5], [7, 8], [10]], (1..10).to_a.split { |i| i % 3 == 0 }
  end

  def test_split_with_edge_values
    assert_equal [[], [2, 3, 4, 5]],  [1, 2, 3, 4, 5].split(1)
    assert_equal [[1, 2, 3, 4], []],  [1, 2, 3, 4, 5].split(5)
    assert_equal [[], [2, 3, 4], []], [1, 2, 3, 4, 5].split { |i| i == 1 || i == 5 }
  end
end

class ArrayToXmlTests < Test::Unit::TestCase
  def test_to_xml
    xml = [
      { :name => "David", :age => 26, :age_in_millis => 820497600000 },
      { :name => "Jason", :age => 31, :age_in_millis => BigDecimal.new('1.0') }
    ].to_xml(:skip_instruct => true, :indent => 0)

    assert_equal '<records type="array"><record>', xml.first(30)
    assert xml.include?(%(<age type="integer">26</age>)), xml
    assert xml.include?(%(<age-in-millis type="integer">820497600000</age-in-millis>)), xml
    assert xml.include?(%(<name>David</name>)), xml
    assert xml.include?(%(<age type="integer">31</age>)), xml
    assert xml.include?(%(<age-in-millis type="decimal">1.0</age-in-millis>)), xml
    assert xml.include?(%(<name>Jason</name>)), xml
  end

  def test_to_xml_with_dedicated_name
    xml = [
      { :name => "David", :age => 26, :age_in_millis => 820497600000 }, { :name => "Jason", :age => 31 }
    ].to_xml(:skip_instruct => true, :indent => 0, :root => "people")

    assert_equal '<people type="array"><person>', xml.first(29)
  end

  def test_to_xml_with_options
    xml = [
      { :name => "David", :street_address => "Paulina" }, { :name => "Jason", :street_address => "Evergreen" }
    ].to_xml(:skip_instruct => true, :skip_types => true, :indent => 0)

    assert_equal "<records><record>", xml.first(17)
    assert xml.include?(%(<street-address>Paulina</street-address>))
    assert xml.include?(%(<name>David</name>))
    assert xml.include?(%(<street-address>Evergreen</street-address>))
    assert xml.include?(%(<name>Jason</name>))
  end

  def test_to_xml_with_dasherize_false
    xml = [
      { :name => "David", :street_address => "Paulina" }, { :name => "Jason", :street_address => "Evergreen" }
    ].to_xml(:skip_instruct => true, :skip_types => true, :indent => 0, :dasherize => false)

    assert_equal "<records><record>", xml.first(17)
    assert xml.include?(%(<street_address>Paulina</street_address>))
    assert xml.include?(%(<street_address>Evergreen</street_address>))
  end

  def test_to_xml_with_dasherize_true
    xml = [
      { :name => "David", :street_address => "Paulina" }, { :name => "Jason", :street_address => "Evergreen" }
    ].to_xml(:skip_instruct => true, :skip_types => true, :indent => 0, :dasherize => true)

    assert_equal "<records><record>", xml.first(17)
    assert xml.include?(%(<street-address>Paulina</street-address>))
    assert xml.include?(%(<street-address>Evergreen</street-address>))
  end

  def test_to_with_instruct
    xml = [
      { :name => "David", :age => 26, :age_in_millis => 820497600000 },
      { :name => "Jason", :age => 31, :age_in_millis => BigDecimal.new('1.0') }
    ].to_xml(:skip_instruct => false, :indent => 0)

    assert_match(/^<\?xml [^>]*/, xml)
    assert_equal 0, xml.rindex(/<\?xml /)
  end

  def test_to_xml_with_block
    xml = [
      { :name => "David", :age => 26, :age_in_millis => 820497600000 },
      { :name => "Jason", :age => 31, :age_in_millis => BigDecimal.new('1.0') }
    ].to_xml(:skip_instruct => true, :indent => 0) do |builder|
      builder.count 2
    end

    assert xml.include?(%(<count>2</count>)), xml
  end

  def test_to_xml_with_empty
    xml = [].to_xml
    assert_match(/type="array"\/>/, xml)
  end
end

class ArrayExtractOptionsTests < Test::Unit::TestCase
  def test_extract_options
    assert_equal({}, [].extract_options!)
    assert_equal({}, [1].extract_options!)
    assert_equal({:a=>:b}, [{:a=>:b}].extract_options!)
    assert_equal({:a=>:b}, [1, {:a=>:b}].extract_options!)
  end
end

uses_mocha "ArrayExtRandomTests" do
  class ArrayExtRandomTests < Test::Unit::TestCase
    def test_random_element_from_array
      assert_nil [].rand

      Kernel.expects(:rand).with(1).returns(0)
      assert_equal 'x', ['x'].rand

      Kernel.expects(:rand).with(3).returns(1)
      assert_equal 2, [1, 2, 3].rand
    end
  end
end
