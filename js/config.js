// Swap art/audio here as it lands. Paths are relative to engine/index.html.
// Mappings are id -> filename; dirs below. Sprites default to sprites/<char>/<expr>.png (see EXPR_MOOD fallback).
window.ASSETS = {
  // All art/audio resolves as dirs[kind] + filename. Mappings below are id -> filename only; rename here if artists rename.
  dirs: { bg: "assets/bg/", cg: "assets/cg/", sprites: "assets/sprites/", sprites_v3: "assets/sprites_v3/", music: "assets/music/", sfx: "assets/sfx/" },
  styleMaster: null,
  showPlaceholderLabels: false, // preview/dist: no dev labels or silhouettes, solid colour only
  bg: { // draft bg_id -> Atlas file in art/bg (Robert's alias map, Oct 12 23:34). An exact bg_<draftid>.* always wins.
    brick_house_porch_dusk: "bg_porch_storm_dusk.png",
    brick_house_kitchen_morning: "bg_house_kitchen_morning.png",
    brick_house_living_room: "bg_house_living_room_day.png",
    brick_house_side_yard_morning: "bg_dirt_pile_yard_day.png",     // + time-of-day tints
    uncle_fred_house: "bg_fred_house_front_day.png",
    uncle_fred_house_day: "bg_fred_house_front_day.png",
    car_interior_dusk: "bg_car_interior_dusk.png",
    brick_house_living_room_day: "bg_house_living_room_day.png",   // Pops and the Ocean; its other bgs have no art yet -> solid colour
    // exact files now used (Atlas, 23:35): bg_brick_house_living_room_dusk, _side_yard_noon/_afternoon/_sunset, bg_burger_place_booth,
    // bg_car_interior_day, bg_uncle_fred_house_backyard_afternoon. bg_desert_highway_dusk is NOT car_interior_day.
  },
  bgTint: { // CSS overlay applied over mapped/stand-in bgs (not over an exact bg_<draftid> file)
    brick_house_side_yard_morning: "linear-gradient(rgba(255,225,170,.18),rgba(160,190,220,.12))",
  },
  bgFallbackDir: "",         // tries <dir><id>.jpg / .png / .webp before placeholder
  sprites: {
    // optional per-char override: id -> "<subdir>/{expr}.png"; default is sprites/<char>/<expr>.png
  },
  music: {},                            // tracks resolve as dirs.music + <id>.ogg (see MUSIC)
  sfx: { // Ch1: Echo engine_sfx_map_suggested.js (Oct 30; cue_* mixes for multi-sound lines). Missing file -> caption only.
    "distant_thunder_low_wind_in_dry_grass": "cue_porch_wind_distant_thunder_loop.ogg",
    "first_fat_raindrops_on_the_roof": "rain_first_drops_roof_01.ogg",
    "thunder_closer": "thunder_closer_01.ogg",
    "thunder_crack_porch_light_flickers": "cue_porch_thunder_crack_flicker_01.ogg",
    "rain_heavy_steady": "rain_heavy_steady_loop.ogg",
    "thunder_far_away_now_dripping_eaves": "cue_porch_eaves_far_thunder_loop.ogg",
    "cereal_bowls_clinking_a_school_bus_brake_hissing_far_off": "cue_stayhome_breakfast_bus_01.ogg",
    "front_door_closing_car_pulling_away": "cue_stayhome_door_car_away_01.ogg",
    "old_tv_clicking_on_soft_static_hum": "cue_stayhome_tv_on_hum_01.ogg",
    "a_whistled_easygoing_tv_theme_original_no_real_show_or_lyric": "tv_theme_whistle_loop.ogg",
    "engine_windows_down_wind": "car_dusk_two_lane_loop.ogg",
    "bike_tires_on_gravel_cartoon_noises_game_blips_giggling": "cue_stayhome_play_montage_loop.ogg",
    "muffled_laughter_from_the_kitchen_grandpa_and_fred": "muffled_laughter_kitchen_01.ogg",
    "fryer_sizzle_register_beeps_soda_fountain": "cue_stayhome_burger_counter_loop.ogg",
    "crickets_a_car_door_mom_s_car_pulling_in": "cue_stayhome_evening_car_home_01.ogg",
    "birds_a_shovel_biting_into_dirt": "cue_dirtpile_birds_shovel_loop.ogg",
    "bike_bells_tires_on_gravel": "cue_dirtpile_bells_tires_01.ogg",
    "tires_thump_whoops_dirt_spraying": "bike_jump_land_01.ogg",
    "thud_small_crash": "bike_crash_small_01.ogg",
    "whoosh_tires_leave_dirt": "bike_whoosh_off_ramp_01.ogg",
    "thump_skid": "bike_thump_skid_01.ogg",
    "skateboard_wheels_on_the_street_rolling_past": "skateboard_roll_past_01.ogg",
    "a_bigger_bike_skids_up": "bike_skid_big_01.ogg",
    "tires_cheering": "bike_jump_land_01.ogg",
    "crickets_starting_bike_wheels_ticking": "cue_dirtpile_crickets_wheels_01.ogg",
    "thud_everybody_laughing_again": "bike_crash_small_01.ogg",
    "crickets_muffled_voices_through_the_wall_words_not_clear": "cue_beach_night_crickets_voices_loop.ogg",
    "a_clock_ticking": "clock_ticking_loop.ogg",
    "engine_hum_tires_on_freeway_seams_wind": "car_freeway_seams_loop.ogg",
    "windows_down_warmer_wind": "car_dusk_two_lane_loop.ogg",
    "waves_gulls_wind": "beach_waves_gulls_wind_loop.ogg",
    "a_wave_rolling_in_soft": "wave_roll_in_soft_01.ogg",
    "waves_kids_laughing": "beach_waves_gulls_wind_loop.ogg",
    "time_passing_waves_gulls_waves": "beach_time_passing_01.ogg",
    "crickets_a_fan_humming": "cue_beach_crickets_fan_loop.ogg",
    "engine_hum_tires_on_freeway_seams_windows_cracked": "car_freeway_seams_loop.ogg",
    "freeway_traffic_a_steady_rush_behind_the_house_sprinkler_tic": "cue_boulders_freeway_sprinkler_loop.ogg",
    "freeway_rush_screen_door_laughter": "cue_boulders_freeway_screen_door_01.ogg",
    "engine_hum_tires_on_freeway_seams": "car_freeway_seams_loop.ogg",
    // Part 2
    "rain_on_a_tin_roof_soft": "rain_first_drops_roof_01.ogg",
    "thunder_close_and_loud": "thunder_crack_01.ogg",
    "heavy_rain_thunder_rolling_off": "rain_heavy_steady_loop.ogg",
    "rain_steady": "rain_heavy_steady_loop.ogg",
    "thunder_far_off": "thunder_far_away_01.ogg",
    "no_rain_just_wind_birds_a_dog_barking_once": "birds_morning_yard_loop.ogg",
    "birds_a_truck_going_by_slow": "birds_morning_yard_loop.ogg",
  },
  autoProbe: false,                     // backgrounds: explicit map above only
  probeSprites: true,                   // art/sprites/<char>/<expr>.png, <char>/<char>_<expr>.png, <char>.png
  probeSfx: true, // audio/sfx/<cue>.ogg|.wav|.mp3; caption always shown as fallback                      // probe fallback dirs (no network; local files only)
};
// Flags exactly per flag-map.md (Nova). Keyed by scene id -> option key.
window.FLAG_MAP = {
  porch:    { A: { lets_in_grandpa: 1 }, B: { masks_with_jokes: 1 } },
  stayhome: { A: { lets_in_grandpa: 1 }, B: { masks_with_jokes: 1 } },
  dirtpile: { A: { carries_it_for_others: 1 }, B: {} },
  dadbeach: { A: { lets_in_dad: 1 }, B: {} },              // flag-map: A lets_in_dad +1, B no flag
  // Part 2 — confirmed by Nova (flag-map.md Part 2 section)
  p2wake: { A: { keeps_moving: 1 }, B: { sits_with_it: 1 } },
  p2neil: { A: { dreams_out_loud: 1 }, B: { builds_step_by_step: 1 } },
  boulders: { A: { lets_in_grandpa: 1 }, B: { fred_bond: 1 }, C: { carries_it_for_others: 1 } },
};
window.FLAGS_INIT = { lets_in_grandpa: 0, masks_with_jokes: 0, fred_bond: 0, carries_it_for_others: 0, lets_in_dad: 0,
  keeps_moving: 0, sits_with_it: 0, dreams_out_loud: 0, builds_step_by_step: 0 };   // Part 2 flags (saved with the rest of st.flags)
// Speaker label -> sprite character id (to dim non-speakers)
window.SPEAKER_SPRITE = { AZRIEL: "azriel", GRANDPA: "grandpa_eddie", MOM: "mom", "UNCLE FRED": "uncle_fred",
  ZEKE: "zeke", NEIL: "neil", LACY: "lacy", DEVIN: "devon", MICHAEL: "michael", "BIG KID": "big_kid", VIC: "vic", DAD: "dad", POPS: "dad" };
window.CHAR_COLORS = { azriel: "#d98c4a", grandpa_eddie: "#a8423a", mom: "#7a6ab0", uncle_fred: "#4a7ea8", zeke: "#5aa06a",
  neil: "#c4a640", lacy: "#c0608a", devon: "#b0663a", michael: "#3a8a8a", big_kid: "#777", vic: "#555", dad: "#8a7a5a" };
// UI copy from ../ui-copy.md (Sage, Oct 12). Tagline approved by Charlie: "Before he rose, he had to fall."
window.UI_COPY = {
  title: "The Man Who Rose", tagline: "Before he rose, he had to fall.",
  menu: { begin: "Begin", cont: "Continue", settings: "Settings" },
  chapter: { num: "Chapter 1", title: "Desert Light", meta: "New Mexico · 2002 · Age 5", oneLine: "Chapter 1 — Desert Light" },
  choicePrompt: "",
  parts: { 2: { num: "Part 2", title: "Rainy City", meta: "Working title", endNum: "End of Part 2" } },
  names: { NARRATION: "", GRANDPA: "Grandpa", MOM: "Ma", MA: "Ma", AZRIEL: "Azriel", "UNCLE FRED": "Uncle Fred", ZEKE: "Zeke",
    NEIL: "Neil", LACY: "Lacy", DEVIN: "Devin", MICHAEL: "Michael", "BIG KID": "Big Kid", VIC: "Vic", DAD: "Dad", POPS: "Pops" },
  // exact choice texts from ui-copy.md; engine uses these (checked against drafts by build_scenes.py)
  choices: {
    porch: { A: "Scoot closer to Grandpa and grab his flannel sleeve.", B: "Laugh it off loud: \"That's not even scary!\"" },
    stayhome: { A: "Climb up and sit on the arm of Grandpa's chair.", B: "Do a goofy whistle until he laughs and forgets." },
    dirtpile: { A: "Step in front of Neil. \"Hey. Let's just show him the ramp.\"", B: "Stand right next to Neil, shoulder to shoulder." },
    dadbeach: { A: "\"Okay. Let go. I trust you.\"", B: "Grab his arm tight. \"Not yet! One more minute!\"" },  // from the draft (not in ui-copy.md yet)
    p2wake: { A: "Get up. Feet on the cold floor. Go make the shift.", B: "Lie there one more minute and listen to the rain." },   // from drafts
    p2neil: { A: "Say the big dream out loud, even if it sounds crazy.", B: "Keep it simple: \"First step. Then the next one.\"" },
    boulders: { A: "\"They're Grandpa's!\"", B: "\"They're Uncle Fred's. They're in his yard.\"", C: "\"You should share. One each. Forever.\"" },
  },
};

// ---- Pass 3 (Robert, Oct 12): Theo's v2 CGs + Lyra's music ----
window.ASSETS.titleArt = "title_keyart_v5.jpg"; // newest _vN (>= v5, 1280x720) // file in dirs.cg
// Theo FINAL list (Oct 30 20:25): pinned exactly; was newest _vN in art/cg (Robert Oct 30: finals porch v8, stay_home v7, dirt_pile v9, rock_war v8, car v6, keyart v5 "or newer"). CG file may also be a versioned base name (no extension): engine picks newest <base>_vN.<ext> from art/cg (falls back to <base>.<ext>).
// CG moments: shown from the line containing `show` until the line containing `hide` (or scene end).
// src null = file missing; the moment is skipped (no placeholder invented).
window.CGS = [
  { id: "porch_donkey_story_storm", scene: "porch", file: "cg_ch1_porch_donkey_story_storm_v9.jpg",
    show: "Alright. There were some children who lived near a forest.", hide: "Then he went quiet, watching the rain" },
  { id: "stay_home_day", scene: "stayhome", file: "cg_ch1_stay_home_day_v10.jpg",
    show: ["Up you go. Careful, my old bones.", "[whistling, totally off-key]"], hide: "Let's go see my brother." },
  // dirt pile: Robert "v14 unless v16 exists" vs Theo final v13 -> v16 absent, v14 exists -> v14 (Oct 30 20:56)
  { id: "dirt_pile_day", scene: "dirtpile", file: "cg_ch1_dirt_pile_day_v14.jpg",
    show: "For one second, I was higher than the fence.", hide: "Out on the street, Vic rolled by" },
  { id: "boulders_rock_war", scene: "boulders", file: "cg_ch1_boulder_rock_war_v9.jpg",
    show: "The rest of the day, Zeke and I ran the yard barefoot.", hide: "Good day, Bear?" },
  { id: "car_asleep_dusk", scene: "boulders", file: "cg_ch1_car_asleep_dusk_v6.jpg",
    show: "The road hummed. The sky went orange, then pink.", hide: null },
];
// Music: audio/music/MUSIC_PLAN.md v2 (Lyra, solo piano, Oct 30). OGG looped via Web Audio buffer (gapless); MP3 fallback
// (used first where the browser can't decode Vorbis, e.g. older iOS Safari). Cues are mapped here; the drafts are not edited.
window.MUSIC = {
  fadeIn: 2.0, crossfade: 3.0, stopFade: 3.0, endFade: 6.0, volume: 0.7,
  tracks: ["title_theme_loop", "summer_family_theme_loop", "playful_siblings_theme_loop", "dusk_drive_home_boulders_loop"],
  title: { track: "title_theme_loop", fadeIn: 2 },                       // title/menu + chapter card
  sceneStart: {
    porch: null,                                                          // fade previous cue out (3 s) before the storm
    stayhome: { track: "playful_siblings_theme_loop", gain: 0.63 },      // no tag in draft; quiet (~-4 dB)
  },
  // [MUSIC: ...] tags in order of appearance per scene (null = fade out)
  tags: {
    porch: [null],                                                        // "none — ambience only": no music during the storm
    dirtpile: ["playful_siblings_theme_loop",                             // "light, bouncy acoustic" -> new piano loop
               { track: "summer_family_theme_loop", fadeOut: 3, fadeIn: 3 }], // "warm, slower": 3 s crossfade
    boulders: ["summer_family_theme_loop",                                // "easy, sunny acoustic" -> new piano loop
               "dusk_drive_home_boulders_loop"],                          // "soft, warm"
    dadbeach: [null,                                                      // "none": night beat, ambience only
               { track: "summer_family_theme_loop", gain: 0.8 },          // "road-trip, warm and light" (no dedicated Pops cue in MUSIC_PLAN v2)
               { track: "summer_family_theme_loop", gain: 1 }],           // "bright, open" -> same loop, lifted (never restarts)
    p2wake: [{ track: "summer_family_theme_loop", gain: 0.45, fadeIn: 3 }, // "the Ch1 warm theme, slowed and thinning" (quiet; no slowed edit exists)
             { track: null, fadeOut: 0.25 }],                                // "cut" on the lightning
    p2neil: [{ track: "dusk_drive_home_boulders_loop", gain: 0.55 },        // "low, steady"
             { track: "summer_family_theme_loop", gain: 0.8 },              // "lifts, warmer"
             { track: "summer_family_theme_loop", gain: 1 }],               // "warm, hopeful"
  },
  // background-triggered cues: "<scene>:<bg_id>"
  bgCues: {
    "stayhome:car_interior_day": "summer_family_theme_loop",
    "stayhome:brick_house_living_room_dusk": "dusk_drive_home_boulders_loop",
    "boulders:uncle_fred_house_backyard_afternoon": { track: "playful_siblings_theme_loop", fadeOut: 3, fadeIn: 3 },
  },
  // line-triggered cues (text match)
  lineCues: [
    { scene: "porch", at: "Remember that smell, okay, Bear?", track: "summer_family_theme_loop", gain: 0.5, fadeIn: 4 }, // ~-6 dB soft fade-in
  ],
  fadeOutOnFade: { porch: 3 },                                            // summer fades out with the porch scene
};
window.CREDITS = [
  "The Man Who Rose: Chapter 1, \u201cDesert Light\u201d. Local preview build, not for distribution.",
  "Music: Lyra (solo piano).",
  "Piano samples: Salamander Grand Piano by Alexander Holm (CC-BY 3.0)",
];


// Sprite resolution: <char>/<expr>.png -> <char>/<char>_<expr>.png -> <char>/<mood>.png -> <char>/neutral.png -> silhouette.
// Mira's current sets are happy/neutral/sad; map draft expressions to those moods.
window.EXPR_MOOD = {
  happy: ["grin","eyes_closed_happy","masked_smile","scared_but_grinning","amazed","huge_grin","smile","smile_tired","laughing","content",
          "proud_shovel","amused_shovel","hand_on_boulder","warm_smile","lion_grin","dreamy","tiny_smile","fired_up","airborne","cool_nod","smirk","asleep_smiling","busy",
          "warm_grin","awed","splashing","sunburnt_smile","sleepy_happy","guilty_grin","in_the_water","on_a_board_in_the_shallows","burying_azriel","asleep_on_towel","serious_soft"],
  sad: ["distant","worried","pouty","red_face","unconvinced_soft"],
};
// Characters every build must define (Dad required even though Ch1 drafts don't use him yet).
window.REQUIRED_SPRITES = ["azriel","grandpa_eddie","mom","dad","uncle_fred","zeke","neil","lacy","devon","michael","big_kid","vic"];

// Ambience beds keep playing across bg changes inside the same group (e.g. the car on the freeway); otherwise they fade.
window.BG_GROUP = { car_interior_day: "road", freeway_arizona: "road", freeway_arizona_forest: "road", freeway_california: "road",
  beach_day: "beach", beach_afternoon: "beach", beach_late_afternoon: "beach",
  azriel_bedroom_morning: "apt", azriel_window: "apt", neils_street_day: "neil", neils_yard_day: "neil", neils_street_afternoon: "neil" };
// Solid-colour stand-ins for bgs with no art yet (no labels in dist-preview).
window.BG_SOLID = { black: "#000", boys_room_night: "#1b1f33", freeway_arizona: "#9a6a4a", freeway_arizona_forest: "#3f5a45", freeway_california: "#6f9a6a",
  whittier_aunt_house_day: "#b7a68c", beach_day: "#8fb8cf", beach_afternoon: "#a9b9b4", beach_late_afternoon: "#c49a7a", whittier_aunt_house_night: "#2a2433",
  dream_beach_haze: "#e9e4d6", dream_porch_dusk: "#5a4a52", azriel_bedroom_morning: "#4a5058", azriel_window: "#5d646c", azriel_apartment_kitchen_morning: "#555b62",
  car_interior_rain: "#3e454d", neils_street_day: "#8e8a80", neils_yard_day: "#857f72", neils_street_afternoon: "#77746d" };
// Sprites with no art yet: plain silhouette, never a label, never another character's art (e.g. adult Azriel must not fall back to the kid set).
window.SPRITE_SILHOUETTE = ["azriel_adult", "neil_adult", "hercules"];
// Part 2 lightning CG (Theo/Charlie approved Oct 30). Fired by the op [CG: porch_storm_flash] in drafts/part2-opening-wake.md:23,
// under the CSS white flash. Never use cg_ch1_porch_storm_flash_base.jpg.
window.CGS.push({ id: "porch_storm_flash", scene: "p2wake", file: "cg_ch2_porch_storm_flash_v1.jpg", op: true });
// UI sounds (Echo). Quiet by default; volumes in Menu (saved in localStorage tmwr_vol).
window.UI_SFX = {
 "text_advance": "ui_text_advance.ogg",
 "choice_hover": "ui_choice_hover.ogg",
 "choice_select": "ui_choice_select.ogg",
 "menu_open": "ui_menu_open.ogg",
 "menu_close": "ui_menu_close.ogg",
 "back": "ui_back.ogg",
 "save_confirm": "ui_save_confirm.ogg",
 "load_confirm": "ui_load_confirm.ogg"
};
window.AUDIO_DEFAULTS = { music: 0.7, sfx: 0.8, ui: 0.35, mute: false };
window.FLAGS_PROVISIONAL = [];   // none: Nova confirmed all Part 2 flags (Oct 30)
// Asset-id aliases: drafts say devin_age7, but the brother's asset files/ids use "Devon" (art/sprites/devon/). On screen he stays "Devin".
window.SPRITE_ID_ALIAS = { devin: "devon" };

// ---- Pops and the Ocean art (Oct 30, 9:48 PM) ----
// Atlas bgs: exact bg_<id> files win automatically (boys_room_night, freeway_arizona_forest, freeway_california, whittier_aunt_house_day/_night,
// beach_day/_afternoon/_late_afternoon). The draft uses one id, freeway_arizona, for two shots -> pick the file by the [BG] description.
window.BG_BY_DESC = { freeway_arizona: [["dinosaur", "bg_freeway_arizona_dinosaurs.png"], ["factory", "bg_freeway_arizona_factory.png"]] };
// Mira's v3 poses (art/sprites_v3/<char>/), scoped per scene so other scenes keep their sprites. draft expression tag -> pose file.
window.SPRITE_POSES = { dadbeach: {
  dad: { uniform_off_duty: "uniform_off_duty.png", warm_grin: "warm_grin.png", serious_soft: "serious_soft.png", in_the_water: "in_the_water.png",
         asleep_on_towel: "asleep_on_towel.png", waking: "waking_very_red.png", sunburnt_smile: "sunburnt_smile.png" },
  azriel: { eyes_shut_tight: "eyes_shut_tight.png", huge_grin: "huge_grin.png", awed: "awed.png", amazed: "amazed.png", guilty_grin: "guilty_grin.png", sleepy_happy: "sleepy_happy.png" },
  neil: { whisper: "whisper.png", splashing: "splashing.png" },
  vic: { on_his_back: "on_his_back_headphones.png", not_looking_up: "not_looking_up.png", on_a_board_in_the_shallows: "on_board.png" },
  lacy: { arms_crossed: "arms_crossed.png", burying_azriel: "burying_azriel.png" },
} };
// Size normalization (tools/sprite_norm.py -> js/sprite_norm.js): each pose's alpha bounding box is measured; `axis`/`span` say how much
// of the character's full standing height that box spans, so every pose is drawn at the same pixels-per-character-height.
// Defaults: axis "h", span 1 (a standing figure). Hand-set only for non-standing poses. lift = raise by this fraction of the drawn height
// (lying poses would otherwise sit entirely behind the textbox). If a group is wider than the stage, all posed sprites shrink by the same factor.
window.POSE_SPAN = {
  "dad/in_the_water": { axis: "h", span: 0.62 },          // waist-up in the water, plus the ripple ring
  "dad/asleep_on_towel": { axis: "w", span: 1.18, lift: 0.8 },       // lying down; towel is a bit longer than he is
  "vic/on_his_back_headphones": { axis: "w", span: 1.0, lift: 0.8 }, // lying in bed
  "vic/on_board": { axis: "h", span: 1.05 },              // standing on a board (board adds a little)
  "lacy/burying_azriel": { axis: "h", span: 0.78, lift: 0.25 },       // kneeling over the sand mound
};
// Relative character heights inside scenes that use SPRITE_POSES (adults 1.0). Ch1's other scenes are unchanged.
window.CHAR_HEIGHT = { dad: 1.0, vic: 0.9, lacy: 0.78, neil: 0.74, azriel: 0.7 };
