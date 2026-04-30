/// Migration v3 -> v4: Remap exploration_progress.map_id from old global sequence to new exploration_id values
///
/// Why this exists:
/// - The old system hardcoded map IDs as a global sequence (1–46) across all regions
/// - The new system sources exploration data from metadata.json, where each area has
///   a stable exploration_id that encodes its segment (e.g. 1001–1011 for Huanglong)
/// - Without this migration, all saved exploration progress and notes are orphaned
///   because the IDs no longer match what the commands query against
///
/// Mapping derived from metadata.json exploration_display_order within each segment,
/// in the same global order the old hardcoded structure emitted them.
///
/// Old → New:
///   Huanglong (1–11):           1001–1011
///   Black Shores (12–13):       2001–2002
///   Rinascita/Raguuna (14–26):  3001–3012, 3014  (display_order 1–13)
///   Rinascita/Septimont (27–28): 3013, 3015       (display_order 1–2)
///   Roya/Lahai Roi (29–37):     4001–4009
///   Roya/Frostlands Surface (38–42): 4010–4014
///   Roya/Dimmr Plains (43–46): 4015–4018

use rusqlite::{Connection, Result};

const MAP_ID_REMAPPING: &[(i64, i64)] = &[
    // Huanglong
    (1,  1001), // Gorges of Spirits
    (2,  1002), // Jinzhou
    (3,  1003), // Central Plains
    (4,  1004), // Desorock Highlands
    (5,  1005), // Port City of Guixu
    (6,  1006), // Dim Forest
    (7,  1007), // Wuming Bay
    (8,  1008), // Norfall Barrens
    (9,  1009), // Whining Aix's Mire
    (10, 1010), // Tiger's Maw
    (11, 1011), // Mt. Firmament
    // Black Shores
    (12, 2001), // Black Shores Archipelago
    (13, 2002), // Tethys Deep
    // Rinascita — Raguuna (display_order 1–13)
    (14, 3001), // Raguuna City
    (15, 3002), // Averardo Vault
    (16, 3003), // Penitent's End
    (17, 3004), // Hallowed Reach
    (18, 3005), // Whisperwind Haven
    (19, 3006), // Nimbus Sanctum
    (20, 3007), // Fagaceae Peninsula
    (21, 3008), // Thessaleo Fells
    (22, 3009), // Riccioli Islands
    (23, 3010), // Vault Underground
    (24, 3011), // Avinoleum
    (25, 3012), // Beohr Waters
    (27, 3014), // Fabricatorium of the Deep
    // Rinascita — Septimont (display_order 1–2)
    (26, 3013), // Septimont
    (28, 3015), // Sanguis Plateaus
    // Roya Frostlands — Lahai Roi (display_order 1–9)
    (29, 4001), // Etching Plains
    (30, 4002), // Startorch Academy
    (31, 4003), // Starward Riseway
    (32, 4004), // Fangspire Chasm
    (33, 4005), // Bjartr Woods
    (34, 4006), // Stagnant Run
    (35, 4007), // Rebirth Uplands
    (36, 4008), // Mawburrow Desert
    (37, 4009), // Giants' Gaze
    // Roya Frostlands — Frostlands Surface (display_order 1–5)
    (38, 4010), // Frostlands Transit Port
    (39, 4011), // Mount Gjallar
    (40, 4012), // Starblind Crashsite
    (41, 4013), // Upphaf Forest Ruins
    (42, 4014), // Tidelost Forest
    // Roya Frostlands — Dimmr Plains (display_order 1–4)
    (43, 4015), // Solisia Landing
    (44, 4016), // Sealed Fissure
    (45, 4017), // Silent Crag
    (46, 4018), // Dimmr Deep
];

pub fn migrate_to_v4(conn: &Connection) -> Result<()> {
    // Remap in reverse order (high old IDs first) to avoid any transient
    // collisions if a new ID happens to equal an old ID not yet remapped.
    // Since new IDs (1001+) are all larger than old IDs (1–46), a forward
    // pass is also safe here, but reverse is the correct defensive pattern.
    let tx = conn.unchecked_transaction()?;

    for &(old_id, new_id) in MAP_ID_REMAPPING.iter().rev() {
        tx.execute(
            "UPDATE exploration_progress
             SET map_id = ?1
             WHERE map_id = ?2",
            [new_id, old_id],
        )?;
    }

    tx.commit()
}