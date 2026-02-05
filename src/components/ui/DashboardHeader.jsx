import React, { useState } from 'react';
import Icon from '../AppIcon';
import Input from './Input';

const DashboardHeader = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearchChange = (e) => {
    setSearchQuery(e?.target?.value);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery?.trim()) {
      console.log('Search query:', searchQuery);
    }
  };

  return (
    <header className="dashboard-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="dashboard-header-logo">
            <div className="dashboard-header-logo-icon">
              <Icon name="Wrench" size={24} />
            </div>
            <span className="hidden sm:inline">TechProjectManager</span>
          </div>

          <div className="flex items-center gap-6">
            <form onSubmit={handleSearchSubmit} className="hidden md:block">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search projects, categories..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="w-80"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                  aria-label="Search"
                >
                  <Icon name="Search" size={20} />
                </button>
              </div>
            </form>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                <Icon name="CheckCircle2" size={16} className="text-success" />
                <span className="text-sm font-caption text-muted-foreground">
                  System Active
                </span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card border border-border">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <Icon name="User" size={18} className="text-accent-foreground" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground">Admin User</p>
                  <p className="text-xs font-caption text-muted-foreground">Project Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;