# config.py
# ─────────────────────────────────────────────
# PULSE X — Central Configuration
# Change values here. Nothing else needs editing.
# ─────────────────────────────────────────────

# ── Crisis types your system handles ──────────
# Add or remove freely. The rest of the system adapts.
CRISIS_TYPES = ["medical", "food", "water"]

# ── Clustering ────────────────────────────────
CLUSTER_RADIUS_KM = 30          # Reports within this radius get grouped
MAX_CLUSTER_SIZE = 10           # Max reports in one cluster

# ── Urgency scoring ───────────────────────────
URGENCY_ESCALATION = {
    "medical": {"hours": 2,  "points": 5},  # Medical escalates fast
    "water":   {"hours": 6,  "points": 3},  # Water is urgent
    "food":    {"hours": 8,  "points": 2},  # Food slightly slower
    "default": {"hours": 6,  "points": 2},  # Fallback for any new type
}
CRITICAL_THRESHOLD = 80         # Score >= this → CRITICAL alert
HIGH_THRESHOLD = 60
MEDIUM_THRESHOLD = 40

# ── Volunteer matching ────────────────────────
MAX_VOLUNTEER_MATCHES = 3       # How many volunteers to suggest per cluster
MAX_MATCH_DISTANCE_KM = 100     # Don't suggest volunteers beyond this

# ── Skill matrix ──────────────────────────────
# Maps each crisis type to relevant volunteer skills.
# Add new crisis types here and the matcher instantly supports them.
SKILL_MATRIX = {
    "medical": [
        "doctor", "nurse", "paramedic",
        "first_aid", "pharmacist", "health_worker"
    ],
    "food": [
        "food_distribution", "cook", "driver",
        "logistics", "packing"
    ],
    "water": [
        "engineer", "plumber", "sanitation",
        "driver", "logistics", "water_testing"
    ],
    # ── Add new crisis types below this line ──
    # "shelter": ["construction", "carpenter", "driver"],
    # "education": ["teacher", "counselor", "social_worker"],
}

# Fallback skills if crisis type not in matrix
DEFAULT_SKILLS = ["social_worker", "logistics", "driver"]

# ── Urgency scoring rules ─────────────────────
# These are additive bonuses on top of base score (50)
URGENCY_RULES = {
    "base_score": 50,
    "medical_emergency_bonus": 20,
    "children_elderly_bonus": 15,
    "per_3_days_unmet_bonus": 10,
    "large_population_bonus": 10,       # if affected > 100
    "large_population_threshold": 100,
    "partial_resolution_penalty": -20,
    "max_score": 100,
    "min_score": 1,
}