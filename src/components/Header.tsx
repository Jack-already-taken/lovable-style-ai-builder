import { Show, SignInButton, UserButton } from '@clerk/react';
import { Blocks, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <Link to="/" className="brand" onClick={() => setOpen(false)}>
        <span className="brand-mark"><Blocks size={19} /></span>
        <span>BuilderKit</span>
      </Link>

      <button className="icon-button mobile-menu" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav className={`nav-links ${open ? 'open' : ''}`}>
        <NavLink to="/pricing" onClick={() => setOpen(false)}>Pricing</NavLink>
        <Show when="signed-in">
          <NavLink to="/app" onClick={() => setOpen(false)}>Builder</NavLink>
          <NavLink to="/history" onClick={() => setOpen(false)}>History</NavLink>
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal" fallbackRedirectUrl="/app">
            <button className="button button-secondary">Sign in</button>
          </SignInButton>
        </Show>
      </nav>
    </header>
  );
}
