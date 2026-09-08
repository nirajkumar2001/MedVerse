package com.tcs.medverse.repository;

import com.tcs.medverse.entity.PublishedCaseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PublishedCaseRepository extends JpaRepository<PublishedCaseEntity, String> {

//    @Query(value = """
//            select c from PublishedCaseEntity c
//            where (:q is null or lower(c.caseTitle) like lower(concat('%', :q, '%'))
//               or lower(c.caseDescription) like lower(concat('%', :q, '%'))
//               or lower(c.caseDisease) like lower(concat('%', :q, '%'))
//               or lower(c.caseDe    partment) like lower(concat('%', :q, '%')))
//              and (:disease is null or lower(c.caseDisease) = lower(:disease))
//              and (:department is null or lower(c.caseDepartment) = lower(:department))
//            order by c.caseReviewedDate desc nulls last, c.caseId desc
//            """)
//    Page<PublishedCaseEntity> searchFeed(
//            @Param("q") String q,
//            @Param("disease") String disease,
//            @Param("department") String department,
//            Pageable pageable
//    );


    @Query("select c from PublishedCaseEntity c " +
            "order by c.caseReviewedDate desc, c.caseId desc")
    Page<PublishedCaseEntity> findAllCases(Pageable pageable);


    @Query("select distinct c.caseDisease from PublishedCaseEntity c where c.caseDisease is not null order by c.caseDisease asc")
    List<String> findDistinctDiseases();
}