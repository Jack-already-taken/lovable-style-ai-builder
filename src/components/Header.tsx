import { Show, SignInButton, UserButton } from '@clerk/react';
import { Link, NavLink } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark"><Sparkles size={18} /></span>
        BuilderKit AI
      </Link>
      <nav className="nav-links">
        <NavLink to="/pricing">Pricing</NavLink>
        <Show when="signed-in">
          <NavLink to="/app">Builder</NavLink>
          <NavLink to="/history">History</NavLink>
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="button button-secondary">Sign in</button>
          </SignInButton>
        </Show>
      </nav>
    </header>
  );
}
