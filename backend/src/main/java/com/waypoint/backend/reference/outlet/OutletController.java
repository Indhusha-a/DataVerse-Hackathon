package com.waypoint.backend.reference.outlet;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/outlets")
public class OutletController {

    private final OutletService service;

    public OutletController(OutletService service) {
        this.service = service;
    }

    @GetMapping
    public List<OutletResponse> list() {
        return service.listOutlets().stream().map(OutletResponse::from).toList();
    }

    @GetMapping("/{id}")
    public OutletResponse get(@PathVariable UUID id) {
        return OutletResponse.from(service.getOutlet(id));
    }
}
