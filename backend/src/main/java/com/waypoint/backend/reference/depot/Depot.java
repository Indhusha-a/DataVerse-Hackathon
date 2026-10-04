package com.waypoint.backend.reference.depot;

import com.waypoint.backend.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One of the two physical depots (Peliyagoda, Kandy). 'code' matches the
 * literal strings used in the dataset's depot column exactly, so CSV rows
 * can be joined to this table by string equality during seeding.
 */
@Entity
@Table(name = "depots")
@Getter
@Setter
@NoArgsConstructor
public class Depot extends BaseEntity {

    private String code;   // "Peliyagoda" or "Kandy" — matches the CSVs verbatim
    private String name;
    private String district;
}
