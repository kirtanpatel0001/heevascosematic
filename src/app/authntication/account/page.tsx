import Link from 'next/link'

export default function AccountIndex() {
  return (
    <div style={{padding: '2rem'}}>
      <h1>Account</h1>
      <ul>
        <li>
          <Link href="/account/profile">Profile</Link>
        </li>
        <li>
          <Link href="/account/order">Orders</Link>
        </li>
      </ul>
    </div>
  )
}
