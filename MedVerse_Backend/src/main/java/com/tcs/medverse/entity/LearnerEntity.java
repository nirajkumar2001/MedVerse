package com.tcs.medverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table( name = "learner")
@Data
public class LearnerEntity {

    public String getLearnerId() {
        return learnerId;
    }

    public void setLearnerId(String learnerId) {
        this.learnerId = learnerId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getBookmarkId() {
        return bookmarkId;
    }

    public void setBookmarkId(String bookmarkId) {
        this.bookmarkId = bookmarkId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    @Id
    @Column(name = "learner_id", length = 50)
    private String learnerId;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "bookmark_id", length = 50)
    private String bookmarkId;

    @Column(name = "name", length = 150)
    private String name;

    @Column(name = "institution", length = 150)
    private String institution;

    @Column(name = "department", length = 150)
    private String department;

    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @OneToMany(mappedBy = "learner", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<SubmitNewCaseEntity> submittedCases;

    @OneToMany(mappedBy = "learner", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BookmarkEntity> bookmarks;

    @OneToMany(mappedBy = "learner", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PublishedCaseFeedbackEntity> feedbacks;
}
