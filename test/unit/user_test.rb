require File.dirname(__FILE__) + '/../test_helper'

class UserTest < Test::Unit::TestCase

  def test_user_lookup
    user = User.find('justinfriedl')

    lenses =  user.lenses
    if lenses.length > 0
      assert lenses[0].class.name == 'Lens'
    end
    puts user.lenses.length
    assert user.id == 2

    user = User.find({'id'=>2,'method' => 'getById'})
    puts user.lenses.length
    assert user.id == 2
  end

  def test_user_with_params
    user = User.find({'id'=>2,'method' => 'getById', 'includeFavorites' => true})
    puts "with favorites =" + user.lenses.length.to_s
    assert user.id == 2
  end

end

