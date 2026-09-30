package com.system.security;

import com.system.entity.AppUser;
import com.system.entity.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public record AppUserPrincipal(Long id, String username, String password, String fullName, String email, Role role,
                               boolean active, boolean locked) implements UserDetails {
    public static AppUserPrincipal from(AppUser user) {
        return new AppUserPrincipal(user.getId(), user.getUsername(), user.getPasswordHash(), user.getFullName(), user.getEmail(), user.getRole(),
                user.isActive(), user.isLocked());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return !locked; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return active; }
}
