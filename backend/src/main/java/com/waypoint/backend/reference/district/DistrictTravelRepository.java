package com.waypoint.backend.reference.district;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DistrictTravelRepository extends JpaRepository<DistrictTravel, UUID> {
    Optional<DistrictTravel> findByDistrict(String district);
}