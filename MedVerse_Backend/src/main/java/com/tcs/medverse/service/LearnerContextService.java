package com.tcs.medverse.service;

import com.tcs.medverse.entity.LearnerEntity;
import com.tcs.medverse.entity.Signup;
import com.tcs.medverse.repository.SignupRepository;
import com.tcs.medverse.repository.LearnerRepository;
import com.tcs.medverse.exception.BadRequestException;
import com.tcs.medverse.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LearnerContextService {

    private final SignupRepository signupRepository;
    private final LearnerRepository learnerRepository;

    public Signup getAuthOrThrow(String authRefId) {
        return signupRepository.findByAuthRefId(authRefId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    /**
     * Resolves the Learner row for the logged-in auth user.
     * If missing (existing auth users), it auto-creates a learner profile.
     */
    public LearnerEntity getOrCreateLearnerForAuth(String authRefId) {
        Signup auth = getAuthOrThrow(authRefId);

        if (auth.getEmail() == null || auth.getEmail().isBlank()) {
            throw new BadRequestException("Email missing for learner profile");
        }

        return learnerRepository.findById(auth.getUserId())
                .or(() -> learnerRepository.findByEmail(auth.getEmail()))
                .map(learner -> syncLearnerWithSignup(learner, auth))
                .orElseGet(() -> {
                    LearnerEntity learner = new LearnerEntity();
                    learner.setLearnerId(auth.getUserId());
                    learner.setEmail(auth.getEmail());
                    learner.setName(auth.getName());
                    learner.setCreatedDate(auth.getCreatedAt() != null ? auth.getCreatedAt() : LocalDateTime.now());
                    return learnerRepository.save(learner);
                });
    }

    private LearnerEntity syncLearnerWithSignup(LearnerEntity learner, Signup auth) {
        boolean changed = false;

        if (!auth.getUserId().equals(learner.getLearnerId()) && !learnerRepository.existsById(auth.getUserId())) {
            learner.setLearnerId(auth.getUserId());
            changed = true;
        }
        if (learner.getEmail() == null || learner.getEmail().isBlank()) {
            learner.setEmail(auth.getEmail());
            changed = true;
        }
        if (learner.getName() == null || learner.getName().isBlank()) {
            learner.setName(auth.getName());
            changed = true;
        }
        if (learner.getCreatedDate() == null) {
            learner.setCreatedDate(auth.getCreatedAt() != null ? auth.getCreatedAt() : LocalDateTime.now());
            changed = true;
        }

        return changed ? learnerRepository.save(learner) : learner;
    }
}
