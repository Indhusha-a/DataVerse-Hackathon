package com.waypoint.backend.seed;

import com.waypoint.backend.calendar.CalendarDay;
import com.waypoint.backend.calendar.CalendarDayRepository;
import com.waypoint.backend.reference.Brand;
import com.waypoint.backend.reference.depot.Depot;
import com.waypoint.backend.reference.depot.DepotRepository;
import com.waypoint.backend.reference.district.DistrictTravel;
import com.waypoint.backend.reference.district.DistrictTravelRepository;
import com.waypoint.backend.reference.district.RoadClass;
import com.waypoint.backend.reference.outlet.DockType;
import com.waypoint.backend.reference.outlet.Outlet;
import com.waypoint.backend.reference.outlet.OutletRepository;
import com.waypoint.backend.reference.outlet.ParkingConstraint;
import com.waypoint.backend.reference.servicing.ServiceAllowance;
import com.waypoint.backend.reference.servicing.ServiceAllowanceRepository;
import com.waypoint.backend.reference.vehicle.TempCapability;
import com.waypoint.backend.reference.vehicle.Vehicle;
import com.waypoint.backend.reference.vehicle.VehicleRepository;
import com.waypoint.backend.reference.vehicle.VehicleType;
import com.waypoint.backend.security.Role;
import com.waypoint.backend.security.User;
import com.waypoint.backend.security.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Loads reference data and demo accounts from the dataset CSVs. Every step
 * skips when its table already has rows, so repeated runs do not duplicate data.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final DepotRepository depotRepository;
    private final OutletRepository outletRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DistrictTravelRepository districtTravelRepository;
    private final ServiceAllowanceRepository serviceAllowanceRepository;
    private final CalendarDayRepository calendarDayRepository;

    @Value("${app.seed.data-dir}")
    private String dataDir;

    public DataSeeder(DepotRepository depotRepository, OutletRepository outletRepository,
                       VehicleRepository vehicleRepository, UserRepository userRepository,
                       PasswordEncoder passwordEncoder, DistrictTravelRepository districtTravelRepository,
                       ServiceAllowanceRepository serviceAllowanceRepository,
                       CalendarDayRepository calendarDayRepository) {
        this.calendarDayRepository = calendarDayRepository;
        this.depotRepository = depotRepository;
        this.outletRepository = outletRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.districtTravelRepository = districtTravelRepository;
        this.serviceAllowanceRepository = serviceAllowanceRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        seedAll();
    }

    public void seedAll() throws IOException {
        seedDepots();
        seedOutlets();
        seedVehicles();
        seedUsers();
        seedDistrictTravel();
        seedServiceAllowance();
        seedCalendar();
    }

    private void seedDepots() {
        if (depotRepository.count() > 0) return;
        for (String[] d : new String[][]{{"Peliyagoda", "Peliyagoda Distribution Center", "Colombo"},
                                          {"Kandy", "Kandy Regional Hub", "Kandy"}}) {
            Depot depot = new Depot();
            depot.setCode(d[0]);
            depot.setName(d[1]);
            depot.setDistrict(d[2]);
            depotRepository.save(depot);
        }
        log.info("Seeded 2 depots");
    }

    private void seedOutlets() throws IOException {
        if (outletRepository.count() > 0) return;

        Path path = Path.of(dataDir, "outlets.csv");
        List<Depot> depots = depotRepository.findAll();
        int count = 0;

        try (BufferedReader reader = new BufferedReader(new FileReader(path.toFile()))) {
            reader.readLine(); // skip header row
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] f = line.split(",", -1);
                // 0 outlet_id, 1 brand, 2 district, 3 depot, 4 dock_type,
                // 5 parking_constraint, 6 mall_window, 7 window_open_time, 8 window_close_time

                Outlet outlet = new Outlet();
                outlet.setOutletCode(f[0].trim());
                outlet.setBrand(Brand.valueOf(f[1].trim().toUpperCase()));
                outlet.setDistrict(f[2].trim());
                outlet.setDepot(findDepot(depots, f[3].trim()));
                outlet.setDockType(DockType.valueOf(f[4].trim().toUpperCase()));
                outlet.setParkingConstraint(ParkingConstraint.valueOf(f[5].trim().toUpperCase()));

                String mallWindow = f[6].trim();
                if (!mallWindow.isEmpty()) {
                    String[] parts = mallWindow.split("-");
                    outlet.setMallWindowStart(LocalTime.parse(parts[0].trim()));
                    outlet.setMallWindowEnd(LocalTime.parse(parts[1].trim()));
                }

                outlet.setWindowOpenTime(LocalTime.parse(f[7].trim()));
                outlet.setWindowCloseTime(LocalTime.parse(f[8].trim()));

                outletRepository.save(outlet);
                count++;
            }
        }
        log.info("Seeded {} outlets from {}", count, path);
    }

    private void seedVehicles() throws IOException {
        if (vehicleRepository.count() > 0) return;

        Path path = Path.of(dataDir, "vehicles.csv");
        List<Depot> depots = depotRepository.findAll();
        int count = 0;

        try (BufferedReader reader = new BufferedReader(new FileReader(path.toFile()))) {
            reader.readLine(); // skip header
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] f = line.split(",", -1);
                // 0 vehicle_id, 1 type, 2 temp, 3 weight_cap_kg, 4 volume_cap_m3,
                // 5 fuel_type, 6 km_per_l, 7 weekly_fuel_quota_l, 8 depot

                Vehicle vehicle = new Vehicle();
                vehicle.setVehicleCode(f[0].trim());
                vehicle.setType(VehicleType.valueOf(f[1].trim().toUpperCase()));
                vehicle.setTemp(TempCapability.valueOf(f[2].trim().toUpperCase()));
                vehicle.setWeightCapKg(Double.parseDouble(f[3].trim()));
                vehicle.setVolumeCapM3(Double.parseDouble(f[4].trim()));
                vehicle.setFuelType(f[5].trim());
                vehicle.setKmPerL(Double.parseDouble(f[6].trim()));
                vehicle.setWeeklyFuelQuotaL(Double.parseDouble(f[7].trim()));
                vehicle.setDepot(findDepot(depots, f[8].trim()));

                vehicleRepository.save(vehicle);
                count++;
            }
        }
        log.info("Seeded {} vehicles from {}", count, path);
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;

        Depot peliyagoda = depotRepository.findByCode("Peliyagoda").orElseThrow();
        Outlet firstOutlet = outletRepository.findByOutletCode("OUT001").orElseThrow();

        createUser("dispatcher1", "Sanduni Perera", Role.DISPATCHER, peliyagoda.getId(), null);
        createUser("loader1", "Nuwan Silva", Role.LOADER, peliyagoda.getId(), null);
        createUser("driver1", "Tharindu Fernando", Role.DRIVER, peliyagoda.getId(), null);
        createUser("store1", "Dilki Jayasuriya", Role.STORE_MANAGER, null, firstOutlet.getId());
        createUser("admin1", "System Administrator", Role.ADMIN, null, null);

        log.info("Seeded 5 accounts, all with password 'password123'");
    }

    private void createUser(String username, String fullName, Role role, java.util.UUID depotId, java.util.UUID outletId) {
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setFullName(fullName);
        user.setRole(role);
        user.setDepotId(depotId);
        user.setOutletId(outletId);
        user.setActive(true);
        userRepository.save(user);
    }

    private void seedDistrictTravel() throws IOException {
        if (districtTravelRepository.count() > 0) return;

        Path path = Path.of(dataDir, "district_travel.csv");
        List<Depot> depots = depotRepository.findAll();
        int count = 0;

        try (BufferedReader reader = new BufferedReader(new FileReader(path.toFile()))) {
            reader.readLine(); // skip header
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] f = line.split(",", -1);
                // 0 district, 1 depot, 2 road_class, 3 free_flow_kmh, 4 depot_to_district_km,
                // 5 depot_to_district_freeflow_min, 6 inter_stop_km, 7 inter_stop_freeflow_min

                DistrictTravel dt = new DistrictTravel();
                dt.setDistrict(f[0].trim());
                dt.setDepot(findDepot(depots, f[1].trim()));
                dt.setRoadClass(RoadClass.valueOf(f[2].trim().toUpperCase()));
                dt.setFreeFlowKmh(Double.parseDouble(f[3].trim()));
                dt.setDepotToDistrictKm(Double.parseDouble(f[4].trim()));
                dt.setDepotToDistrictFreeflowMin(Double.parseDouble(f[5].trim()));
                dt.setInterStopKm(Double.parseDouble(f[6].trim()));
                dt.setInterStopFreeflowMin(Double.parseDouble(f[7].trim()));

                districtTravelRepository.save(dt);
                count++;
            }
        }
        log.info("Seeded {} district travel rows from {}", count, path);
    }

    private void seedServiceAllowance() throws IOException {
        if (serviceAllowanceRepository.count() > 0) return;

        Path path = Path.of(dataDir, "service_allowance.csv");
        int count = 0;

        try (BufferedReader reader = new BufferedReader(new FileReader(path.toFile()))) {
            reader.readLine(); // skip header
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] f = line.split(",", -1);
                // 0 brand, 1 dock_type, 2 service_allowance_min

                ServiceAllowance sa = new ServiceAllowance();
                sa.setBrand(Brand.valueOf(f[0].trim().toUpperCase()));
                sa.setDockType(DockType.valueOf(f[1].trim().toUpperCase()));
                sa.setServiceAllowanceMin(Double.parseDouble(f[2].trim()));

                serviceAllowanceRepository.save(sa);
                count++;
            }
        }
        log.info("Seeded {} service allowance rows from {}", count, path);
    }

    private void seedCalendar() throws IOException {
        if (calendarDayRepository.count() > 0) return;

        Path path = Path.of(dataDir, "calendar.csv");
        int count = 0;

        try (BufferedReader reader = new BufferedReader(new FileReader(path.toFile()))) {
            reader.readLine(); // skip header
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] f = line.split(",", -1);
                // 0 date, ..., 11 is_operating

                CalendarDay day = new CalendarDay();
                day.setDate(LocalDate.parse(f[0].trim()));
                day.setOperating(f[11].trim().equals("1"));
                calendarDayRepository.save(day);
                count++;
            }
        }
        log.info("Seeded {} calendar days from {}", count, path);
    }

    private Depot findDepot(List<Depot> depots, String code) {
        return depots.stream().filter(d -> d.getCode().equals(code)).findFirst()
                .orElseThrow(() -> new IllegalStateException("Unknown depot in CSV: " + code));
    }
}