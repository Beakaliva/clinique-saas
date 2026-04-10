from rest_framework.permissions import BasePermission


class IsSuperuser(BasePermission):
    """Accès réservé aux superutilisateurs uniquement."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsAdminOrSuperuser(BasePermission):
    """Accès réservé au staff et aux superutilisateurs."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )


class IsSelfOrAdmin(BasePermission):
    """
    Liste / détail :
    - lecture de son propre profil autorisée pour tout utilisateur authentifié
    - modification et suppression réservées au staff/superuser (sauf sur soi-même)
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.is_superuser:
            return True
        # Un utilisateur peut lire et modifier uniquement son propre profil
        if obj == request.user:
            return request.method in ('GET', 'HEAD', 'OPTIONS', 'PATCH', 'PUT')
        return False
