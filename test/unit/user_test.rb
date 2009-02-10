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
    #user = login
    user = User.find({'id'=>2,'method' => 'getById', 'includeFavorites' => true})
    puts "with favorites = " + user.lenses.length.to_s
    withFavs = user.lenses.length

    user = User.find({'id'=>2,'method' => 'getById', 'includeShared' => true, 'includeFavorites' => true})
    puts "with favorites and shares = " + user.lenses.length.to_s
    withFavsAndShares = user.lenses.length
    assert(withFavsAndShares > withFavs)
  end

end

