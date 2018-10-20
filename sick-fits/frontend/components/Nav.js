import Link from 'next/link';

const Nav = props => (
  <div>
    <Link>
      <a href="/sell">Sell</a>
    </Link>
    <Link>
      <a href="/">Home</a>
    </Link>
  </div> 
)

export default Nav;