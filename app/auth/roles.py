ADMIN = "admin"
ANALYST = "analyst"
OPERATOR = "operator"
VIEWER = "viewer"

ROLE_HIERARCHY = {
    ADMIN: 100,
    ANALYST: 70,
    OPERATOR: 50,
    VIEWER: 30,
}


def role_ge(role: str, required: str) -> bool:
    return ROLE_HIERARCHY.get(role, 0) >= ROLE_HIERARCHY.get(required, 0)
