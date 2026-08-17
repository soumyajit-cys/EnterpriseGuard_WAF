ADMIN = "admin"
ANALYST = "analyst"
OPERATOR = "operator"
VIEWER = "viewer"

SUPERADMIN = "superadmin"

# Superadmin is deliberately absent from the hierarchy: it is a platform
# role outside the org tree, so role_ge("superadmin", ...) is False for
# every org-scoped requirement and role_ge(..., "superadmin") is False
# for every org role. Only require_superadmin() admits it.

ROLE_HIERARCHY = {
    ADMIN: 100,
    ANALYST: 70,
    OPERATOR: 50,
    VIEWER: 30,
}


def role_ge(role: str, required: str) -> bool:
    return ROLE_HIERARCHY.get(role, 0) >= ROLE_HIERARCHY.get(required, 0)
