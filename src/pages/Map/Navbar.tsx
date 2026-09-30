import React from "react";

const Navbar: React.FC = () => {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="material-symbols-outlined navbar__icon">map</span>
        <span className="navbar__title">UniMap</span>
      </div>
      <button className="navbar__settings-btn" aria-label="Settings">
        <span className="material-symbols-outlined">settings</span>
      </button>
    </header>
  );
};

export default Navbar;
