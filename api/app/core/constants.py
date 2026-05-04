import re

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]+$")

DEFAULT_USER_RESOURCE_AMOUNTS: dict[str, float] = {
    "Oxígeno":        100.0,
    "Agua":           100.0,
    "Raciones":       3000.0,
    "Combustible":    18.0,
    "Botiquín":       2.0,
    "Baterías":       4.0,
    "Píldoras Radio": 3.0,
}

DEFAULT_BASE_STORAGE_AMOUNTS: dict[str, float] = {
    "Oxígeno":        100.0,
    "Agua":           500.0,
    "Raciones":       10000.0,
    "Combustible":    100.0,
    "Botiquín":       10.0,
    "Baterías":       20.0,
    "Píldoras Radio": 15.0,
}
