"""Role-based permission checker."""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import Request


# Permission definitions
PERMISSIONS = {
    # Requirements
    "requirement:create": "Create requirements",
    "requirement:read": "View requirements",
    "requirement:update": "Update requirements",
    "requirement:delete": "Delete requirements",
    # Analysis
    "analysis:create": "Create analysis",
    "analysis:read": "View analysis",
    "analysis:update": "Update analysis",
    "analysis:approve": "Approve analysis",
    # Distribution
    "distribution:create": "Distribute requirements",
    "distribution:read": "View distribution",
    "distribution:update": "Update distribution",
    # Traceability
    "rtm:read": "View RTM",
    "rtm:update": "Update RTM",
    # Verification
    "verification:create": "Create verification",
    "verification:read": "View verification",
    "verification:approve": "Approve verification",
    # Analytics
    "analytics:read": "View analytics",
    # Collection
    "collection:create": "Create collection data",
    "collection:read": "View collection data",
    "collection:update": "Update collection data",
    # Tenant (admin only)
    "tenant:manage": "Manage tenants",
}


# Role permissions mapping
ROLE_PERMISSIONS = {
    "admin": list(PERMISSIONS.keys()),
    "product_manager": [
        "requirement:create",
        "requirement:read",
        "requirement:update",
        "requirement:delete",
        "analysis:create",
        "analysis:read",
        "analysis:update",
        "analysis:approve",
        "distribution:create",
        "distribution:read",
        "distribution:update",
        "rtm:read",
        "rtm:update",
        "verification:create",
        "verification:read",
        "verification:approve",
        "analytics:read",
        "collection:create",
        "collection:read",
        "collection:update",
    ],
    "marketing_manager": [
        "requirement:create",
        "requirement:read",
        "requirement:update",
        "collection:create",
        "collection:read",
        "collection:update",
        "analysis:read",
        "distribution:read",
        "analytics:read",
    ],
    "sales_manager": [
        "requirement:create",
        "requirement:read",
        "collection:create",
        "collection:read",
        "analysis:read",
        "distribution:read",
        "verification:read",
        "analytics:read",
    ],
    "pm": [  # Legacy - mapped to product_manager
        "requirement:create",
        "requirement:read",
        "requirement:update",
        "requirement:delete",
        "analysis:create",
        "analysis:read",
        "analysis:update",
        "analysis:approve",
        "distribution:create",
        "distribution:read",
        "distribution:update",
        "rtm:read",
        "rtm:update",
        "verification:create",
        "verification:read",
        "verification:approve",
        "analytics:read",
        "collection:create",
        "collection:read",
        "collection:update",
    ],
    "engineer": [
        "requirement:read",
        "analysis:read",
        "rtm:read",
        "rtm:update",
        "verification:create",
        "verification:read",
    ],
    "stakeholder": [
        "requirement:read",
        "collection:create",
        "collection:read",
        "analysis:read",
    ],
}


def has_permission(user_role: str, permission: str) -> bool:
    """Check if user role has permission."""
    # Map legacy roles
    role_mapping = {
        "pm": "product_manager",
    }
    mapped_role = role_mapping.get(user_role, user_role)

    permissions = ROLE_PERMISSIONS.get(mapped_role, [])
    return permission in permissions


def can_create_requirement(user_role: str) -> bool:
    """Check if user can create requirements."""
    return has_permission(user_role, "requirement:create")


def can_update_requirement(user_role: str) -> bool:
    """Check if user can update requirements."""
    return has_permission(user_role, "requirement:update")


def can_delete_requirement(user_role: str) -> bool:
    """Check if user can delete requirements."""
    return has_permission(user_role, "requirement:delete")


def can_approve_analysis(user_role: str) -> bool:
    """Check if user can approve analysis."""
    return has_permission(user_role, "analysis:approve")


def can_approve_verification(user_role: str) -> bool:
    """Check if user can approve verification."""
    return has_permission(user_role, "verification:approve")


def get_user_permissions(user_role: str) -> list[str]:
    """Get all permissions for a role."""
    role_mapping = {
        "pm": "product_manager",
    }
    mapped_role = role_mapping.get(user_role, user_role)
    return ROLE_PERMISSIONS.get(mapped_role, [])
