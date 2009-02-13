require File.dirname(__FILE__) + '/../test_helper'

class LensTest < Test::Unit::TestCase

  def test_user_with_params

    lenses = Lens.find('userId'=>2)
    if lenses.length > 0
      assert lenses[0].class.name == 'Lens'
    end
    normal = lenses.length

    lenses = Lens.find({'includeFavorites' => true})
    puts "with favorites = " + lenses.length.to_s
    withFavs = lenses.length
    assert(withFavs > normal)

    lenses = Lens.find({'includeFavorites' => true, 'includeShared' => true})
   
    puts "with favorites and shares = " + lenses.length.to_s
    withFavsAndShares = lenses.length
    assert(withFavsAndShares > withFavs)
  end

end

