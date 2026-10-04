package com.waypoint.backend.reference.vehicle;

import com.waypoint.backend.audit.AuditService;
import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.reference.depot.Depot;
import com.waypoint.backend.reference.depot.DepotRepository;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.trips.TripRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final DepotRepository depotRepository;
    private final TripRepository tripRepository;
    private final AuditService auditService;

    public VehicleService(VehicleRepository vehicleRepository, DepotRepository depotRepository,
                          TripRepository tripRepository, AuditService auditService) {
        this.vehicleRepository = vehicleRepository;
        this.depotRepository = depotRepository;
        this.tripRepository = tripRepository;
        this.auditService = auditService;
    }

    public List<Vehicle> list() {
        return vehicleRepository.findAll();
    }

    public Vehicle get(UUID id) {
        return vehicleRepository.findById(id).orElseThrow(() -> ApiException.notFound("Vehicle not found: " + id));
    }

    @Transactional
    public Vehicle create(VehicleUpsertRequest request, CustomUserDetails actor) {
        Vehicle vehicle = new Vehicle();
        apply(vehicle, request, depot(request.depotCode()));
        Vehicle saved = vehicleRepository.save(vehicle);
        audit(actor, "VEHICLE_CREATED", saved);
        return saved;
    }

    @Transactional
    public Vehicle update(UUID id, VehicleUpsertRequest request, CustomUserDetails actor) {
        Vehicle vehicle = get(id);
        apply(vehicle, request, depot(request.depotCode()));
        Vehicle saved = vehicleRepository.save(vehicle);
        audit(actor, "VEHICLE_UPDATED", saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id, CustomUserDetails actor) {
        Vehicle vehicle = get(id);
        if (tripRepository.existsByVehicleId(id)) {
            throw ApiException.conflict("Vehicle " + vehicle.getVehicleCode() + " has trips and cannot be deleted");
        }
        vehicleRepository.delete(vehicle);
        audit(actor, "VEHICLE_DELETED", vehicle);
    }

    private Depot depot(String code) {
        return depotRepository.findByCode(code)
                .orElseThrow(() -> ApiException.badRequest("Unknown depot code: " + code));
    }

    private void apply(Vehicle vehicle, VehicleUpsertRequest request, Depot depot) {
        vehicle.setVehicleCode(request.vehicleCode());
        vehicle.setType(request.type());
        vehicle.setTemp(request.temp());
        vehicle.setWeightCapKg(request.weightCapKg());
        vehicle.setVolumeCapM3(request.volumeCapM3());
        vehicle.setFuelType(request.fuelType());
        vehicle.setKmPerL(request.kmPerL());
        vehicle.setWeeklyFuelQuotaL(request.weeklyFuelQuotaL());
        vehicle.setDepot(depot);
    }

    private void audit(CustomUserDetails actor, String action, Vehicle vehicle) {
        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), action,
                "Vehicle", vehicle.getId().toString(), "API", "SUCCESS", "code=" + vehicle.getVehicleCode());
    }
}
