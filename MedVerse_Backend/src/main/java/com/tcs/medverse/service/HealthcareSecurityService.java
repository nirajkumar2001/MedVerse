package com.tcs.medverse.service;

import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.enums.AuthStatus;
import com.tcs.medverse.enums.Role;
import com.tcs.medverse.exception.ForbiddenException;
import com.tcs.medverse.exception.ResourceNotFoundException;
import com.tcs.medverse.exception.UnauthorizedException;
import com.tcs.medverse.repository.SignupRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class HealthcareSecurityService {

    private final SignupRepository signupRepository;

    public HealthcareSecurityService(SignupRepository signupRepository) {
        this.signupRepository = signupRepository;
    }

    public Signup currentApprovedUser(Authentication authentication, Role requiredRole) {
        Signup signup = currentUser(authentication, requiredRole);

        if (signup.getAuthStatus() != AuthStatus.APPROVED) {
            throw new ForbiddenException("Your account is not approved by admin yet");
        }

        return signup;
    }

    public Signup currentUser(Authentication authentication, Role requiredRole) {
        Signup signup = currentUser(authentication);

        if (signup.getRole() != requiredRole) {
            throw new ForbiddenException("This action is only allowed for " + requiredRole + " users");
        }

        return signup;
    }

    public Signup currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new UnauthorizedException("Unauthorized access. Please login first.");
        }

        return signupRepository.findByAuthRefId(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    public boolean hasRole(Authentication authentication, Role role) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        String expected = "ROLE_" + role.name();
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (expected.equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
