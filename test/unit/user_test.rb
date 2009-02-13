require File.dirname(__FILE__) + '/../test_helper'

class UserTest < Test::Unit::TestCase

  def login
    #this is temporary until we get the wiring of login from the UI set up
    #User.login('justinfriedl', 'blist')
  end

  def test_login
    #u = login
    #assert u.lastName == 'friedl'
  end

  def test_user_lookup
    #user = login
    user = User.find('justinfriedl')    
    assert user.id == 2
  end

  def test_user_lookup_by_id
    #user = login
    user = User.find({'id'=>2,'method' => 'getById'})
    assert user.id == 2
  end

end

