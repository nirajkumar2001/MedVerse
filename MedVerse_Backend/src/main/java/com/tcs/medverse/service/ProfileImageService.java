package com.tcs.medverse.service;

import com.tcs.medverse.exception.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Set;

@Service
public class ProfileImageService {

    private static final long MAX_PROFILE_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    public String toDataUrl(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Profile image file is required");
        }

        if (file.getSize() > MAX_PROFILE_IMAGE_SIZE_BYTES) {
            throw new BadRequestException("Profile image must not exceed 2 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Profile image must be JPEG, PNG, or WEBP");
        }

        try {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            return "data:" + contentType.toLowerCase() + ";base64," + base64;
        } catch (IOException e) {
            throw new BadRequestException("Failed to read profile image");
        }
    }
}
