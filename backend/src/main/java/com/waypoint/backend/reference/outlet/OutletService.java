package com.waypoint.backend.reference.outlet;

import com.waypoint.backend.common.ApiException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Read access to outlet reference data (used by every role). Outlets are
 * fixed, read-only reference data — the 120 outlets are seeded
 * once from the dataset and never modified via the API.
 */
@Service
public class OutletService {

    private final OutletRepository outletRepository;

    public OutletService(OutletRepository outletRepository) {
        this.outletRepository = outletRepository;
    }

    public List<Outlet> listOutlets() {
        return outletRepository.findAll();
    }

    public Outlet getOutlet(UUID id) {
        return outletRepository.findById(id).orElseThrow(() -> ApiException.notFound("Outlet not found: " + id));
    }
}
