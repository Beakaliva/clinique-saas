from rest_framework.permissions import BasePermission


_TRIAL_EXEMPT_VIEWS = {
    'LoginView', 'LogoutView', 'MeView', 'RegisterView',
    'ChangePasswordView', 'TokenObtainPairView', 'TokenRefreshView',
}

class ClinicAccessPermission(BasePermission):
    """
    Bloque l'accès si le trial est expiré ET que la clinique n'est pas abonnée.
    Exempt : auth views, superusers.
    """
    message = "Votre période d'essai est terminée. Veuillez souscrire à un abonnement."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return True  # laisse IsAuthenticated gérer le cas non-auth
        # Superusers : accès total
        if request.user.is_superuser:
            return True
        # Vues d'auth exemptées
        view_name = view.__class__.__name__
        if view_name in _TRIAL_EXEMPT_VIEWS:
            return True
        clinic = getattr(request.user, 'clinic', None)
        if clinic is None:
            return False
        return clinic.has_access


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
