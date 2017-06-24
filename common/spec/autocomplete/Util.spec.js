import { getCeteraUrl } from 'common/autocomplete/Util';

describe('getCeteraUrl', () => {
  it('properly generates cetera url', () => {
    expect(getCeteraUrl('birds')).to.eq('/cetera/autocomplete?q=birds')
  })

  it('properly generates categories', () => {
    expect(getCeteraUrl('birds', 'Business')).to.eq('/cetera/autocomplete?q=birds&categories[]=Business')
  })

  it('properly generates anonymity', () => {
    expect(getCeteraUrl('birds', undefined, true)).to.eq('/cetera/autocomplete?q=birds&anonymous=true')
  })

  it('properly generates nymity', () => {
    expect(getCeteraUrl('birds', undefined, false)).to.eq('/cetera/autocomplete?q=birds&anonymous=false')
  })
})
