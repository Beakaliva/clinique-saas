from rest_framework import filters, exceptions
from django_filters.rest_framework import DjangoFilterBackend

READ_METHODS   = ('GET', 'HEAD', 'OPTIONS')
CREATE_METHODS = ('POST',)
UPDATE_METHODS = ('PUT', 'PATCH')
DELETE_METHODS = ('DELETE',)


class ClinicScopedMixin:
    """
    Restreint automatiquement les querysets à la clinique de l'utilisateur connecté
    et applique les permissions C/R/U/D de l'utilisateur.
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    def get_queryset(self):
        return super().get_queryset().filter(clinic=self.request.user.clinic)

    def perform_create(self, serializer):
        serializer.save(clinic=self.request.user.clinic)

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        # Les superusers et staff ignorent les restrictions
        if not user or not user.is_authenticated:
            return
        if user.is_superuser or user.is_staff:
            return
        method = request.method
        if method in READ_METHODS and not user.can_read:
            raise exceptions.PermissionDenied("Lecture non autorisée pour votre niveau d'accès.")
        if method in CREATE_METHODS and not user.can_create:
            raise exceptions.PermissionDenied("Création non autorisée pour votre niveau d'accès.")
        if method in UPDATE_METHODS and not user.can_update:
            raise exceptions.PermissionDenied("Modification non autorisée pour votre niveau d'accès.")
        if method in DELETE_METHODS and not user.can_delete:
            raise exceptions.PermissionDenied("Suppression non autorisée pour votre niveau d'accès.")
