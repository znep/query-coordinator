import { getCeteraUrl } from 'common/autocomplete/Util';

describe('getCeteraUrl', () => {
  it('properly generates cetera url', () => {
    expect(getCeteraUrl('birds')).to.eq('/cetera/autocomplete?q=birds')
  })

  it('properly generates categories', () => {
    expect(getCeteraUrl('birds', 'Business')).to.eq('/cetera/autocomplete?q=birds&categories[]=Business')
  })
})
