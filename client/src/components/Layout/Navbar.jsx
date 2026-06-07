import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-brand">
        <div className="brand-icon">F</div>
        Flowspace
      </Link>

      {user && (
        <div className="nav-user">
          <div className="user-profile">
            <div className="avatar">{user.avatar || user.name.charAt(0).toUpperCase()}</div>
            <span className="user-name">{user.name}</span>
          </div>
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
