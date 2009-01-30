require File.dirname(__FILE__) + '/../test_helper'

class UserTest < Test::Unit::TestCase

  def test_user_lookup

    user = User.find(2)
    
    lenses =  user.lenses
    if lenses.length > 0
      assert lenses[0].class.name == 'Lens'
    end
    puts user.lenses.length
    assert user.id == 2

  end

end

