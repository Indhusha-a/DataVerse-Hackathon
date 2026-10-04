package com.waypoint.backend.reference.vehicle;

/** AMBIENT vehicles can only carry ambient goods. REEFER can carry both
 *  ambient and chilled — this asymmetry is a hard constraint the planning
 *  allocation engine must respect. */
public enum TempCapability {
    AMBIENT, REEFER
}
