/// Migration v2 -> v3: Normalize legacy echo set keys (`set_X`) to canonical metadata IDs (`echo_set_*`)
///
/// Why this exists:
/// - Older user databases store echo_builds.primary_set_key / secondary_set_key as values like `set_26`
/// - The current centralized asset metadata uses canonical IDs like `echo_set_trailblazing_star`
/// - The frontend now resolves Sonata Effect data by canonical key, so old DB values no longer match
///
/// Important:
/// - This migration intentionally updates ONLY echo_builds.{primary_set_key, secondary_set_key}
/// - It does NOT touch echoes.echo_set, because that field is currently used as a display-name-style value
use rusqlite::{Connection, Result};

const LEGACY_ECHO_SET_MAPPINGS: &[(&str, &str)] = &[
    ("set_1", "echo_set_freezing_frost"),
    ("set_2", "echo_set_molten_rift"),
    ("set_3", "echo_set_void_thunder"),
    ("set_4", "echo_set_sierra_gale"),
    ("set_5", "echo_set_celestial_light"),
    ("set_6", "echo_set_havoc_eclipse"),
    ("set_7", "echo_set_rejuvenating_glow"),
    ("set_8", "echo_set_moonlit_clouds"),
    ("set_9", "echo_set_lingering_tunes"),
    ("set_10", "echo_set_frosty_resolve"),
    ("set_11", "echo_set_eternal_radiance"),
    ("set_12", "echo_set_midnight_veil"),
    ("set_13", "echo_set_empyrean_anthem"),
    ("set_14", "echo_set_tidebreaking_courage"),
    ("set_15", "echo_set_gusts_of_welkin"),
    ("set_16", "echo_set_flaming_clawprint"),
    ("set_17", "echo_set_windward_pilgrimage"),
    ("set_18", "echo_set_dream_of_the_lost"),
    ("set_19", "echo_set_crown_of_valor"),
    ("set_20", "echo_set_law_of_harmony"),
    ("set_21", "echo_set_flamewing's_shadow"),
    ("set_22", "echo_set_thread_of_severed_fate"),
    ("set_23", "echo_set_halo_of_starry_radiance"),
    ("set_24", "echo_set_pact_of_neonlight_leap"),
    ("set_25", "echo_set_rite_of_gilded_revelation"),
    ("set_26", "echo_set_trailblazing_star"),
    ("set_27", "echo_set_chromatic_foam"),
    ("set_28", "echo_set_sound_of_true_name"),
    ("set_29", "echo_set_wishes_of_quiet_snowfall"),
    ("set_30", "echo_set_reel_of_spliced_memories"),
];

pub fn migrate_to_v3(conn: &Connection) -> Result<()> {
    for (legacy_key, canonical_key) in LEGACY_ECHO_SET_MAPPINGS {
        conn.execute(
            "UPDATE echo_builds
             SET primary_set_key = ?1
             WHERE primary_set_key = ?2",
            [*canonical_key, *legacy_key],
        )?;

        conn.execute(
            "UPDATE echo_builds
             SET secondary_set_key = ?1
             WHERE secondary_set_key = ?2",
            [*canonical_key, *legacy_key],
        )?;
    }

    Ok(())
}
