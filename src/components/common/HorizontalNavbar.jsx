import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Branding from './Branding';
import {
  FaHome,
  FaSchool,
  FaUsers,
  FaCreditCard,
  FaIdCard,
  FaPalette,
  FaUserCircle,
  FaSignOutAlt,
  FaBell,
  FaChevronDown,
  FaKey,
  FaBullhorn,
  FaCog,
  FaSlidersH,
  FaFileAlt,
  FaUserGraduate
} from 'react-icons/fa';

function HorizontalNavbar() {
  const { user, school, logout, isOwner, isSchoolAdmin, isSchoolStaff } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showReportDropdown, setShowReportDropdown] = useState(false);

  const getMenuItems = () => {
    if (isOwner) {
      return [
        { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
        { path: '/schools', icon: FaSchool, label: 'Schools' },
        { path: '/users', icon: FaUsers, label: 'Users' },
        { path: '/credits', icon: FaCreditCard, label: 'Credits' },
        { path: '/designs', icon: FaPalette, label: 'Designs' },
      ];
    } else if (isSchoolAdmin) {
      return [
        { path: '/admin/dashboard', icon: FaHome, label: 'Dashboard' },
        { path: '/credits', icon: FaCreditCard, label: 'Credits' },
        { path: '/admin/id-cards/generate', icon: FaIdCard, label: 'Generate ID' },
      ];
    } else if (isSchoolStaff) {
      return [
        { path: '/staff/dashboard', icon: FaHome, label: 'Dashboard' },
        { path: '/credits', icon: FaCreditCard, label: 'Credits' },
        { path: '/staff/id-cards/generate', icon: FaIdCard, label: 'Generate ID' },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    const role = user?.role;
    if (role === 'OWNER') return <span className="badge-owner ms-2">Owner</span>;
    if (role === 'SCHOOL_ADMIN') return <span className="badge-admin ms-2">Admin</span>;
    if (role === 'SCHOOL_STAFF') return <span className="badge-staff ms-2">Staff</span>;
    return null;
  };

  return (
    <nav className="navbar-horizontal">
      <div className="navbar-horizontal-brand">
        <Branding size="sm" variant="header" />
      </div>

      <ul className="navbar-horizontal-menu">
        {menuItems.map((item) => (
          <li key={item.path}>
            <NavLink 
              to={item.path} 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}

        {isOwner && (
          <li className="settings-dropdown">
            <a
              href="#"
              className="dropdown-toggle"
              onClick={(e) => {
                e.preventDefault();
                e.preventDefault();
                setShowReportDropdown(!showReportDropdown);
                setShowSettingsDropdown(false);
              }}
            >
              <FaFileAlt />
              <span> Report</span>
              {/* <FaChevronDown size={10} style={{ marginLeft: 4 }} /> */}
            </a>

            {showReportDropdown && (
              <div className="dropdown-menu-custom show">
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setShowReportDropdown(false);
                    navigate('/id-cards');
                  }}
                >
                  <FaIdCard className="dropdown-icon me-2" />
                  ID Cards
                </button>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setShowReportDropdown(false);
                    navigate('/reports/students');
                  }}
                >
                  <FaUserGraduate className="dropdown-icon me-2" />
                  Student Details
                </button>
              </div>
            )}
          </li>
        )}

        {isOwner && (
          <li className='settings-dropdown'>
            <a href="#" className='dropdown-toggle'
              onClick={(e) => { e.preventDefault(); setShowSettingsDropdown(!showSettingsDropdown); setShowReportDropdown(false); }}
            >
              <FaSlidersH />
              <span> Settings</span>
            </a>

            {showSettingsDropdown && (
              <div className="dropdown-menu-custom show">
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setShowSettingsDropdown(false);
                    navigate('/branding');
                  }}
                >
                  <FaCog className="dropdown-icon me-2" />
                  App Settings
                </button>

                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setShowSettingsDropdown(false);
                    navigate('/advertisements');
                  }}
                >
                  <FaBullhorn className="dropdown-icon me-2" />
                  Ads
                </button>
              </div>
            )}
          </li>
        )}

      </ul>

      <div className="navbar-horizontal-right">
        {/* {school && (
          <span className="school-name me-3">
            <FaSchool className="me-1" />
            {school.name}
          </span>
        )} */}

        {/* <button className="btn btn-light btn-sm rounded-circle me-2" style={{ width: '36px', height: '36px' }}>
          <FaBell />
        </button> */}

        <div className="dropdown-container">
          <button
            className="btn btn-light dropdown-toggle d-flex align-items-center gap-2"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <FaUserCircle size={20} />
            <span className="d-none d-md-inline">{user?.email?.split('@')[0]}</span>
            {getRoleBadge()}
            {/* <FaChevronDown size={12} /> */}
          </button>

          {showDropdown && (
            <div className="dropdown-menu-custom show">
              <div className="dropdown-item-text">
                <strong style={{color:'black'}}>{user?.email}</strong>
                <br />
                <small className="text-muted">{user?.role}</small>
              </div>
              <hr className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/profile'); }}>
                Profile
              </button>
              <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/profile'); }}>
                <FaKey className="dropdown-icon me-2" /> Change Password
              </button>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <FaSignOutAlt className="me-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default HorizontalNavbar;