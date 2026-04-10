from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend


class ClinicScopedMixin:
    """
    Restreint automatiquement les querysets à la clinique de l'utilisateur connecté.
    À hériter dans toutes les vues qui manipulent des données cloisonnées par clinique.
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    def get_queryset(self):
        return super().get_queryset().filter(clinic=self.request.user.clinic)

    def perform_create(self, serializer):
        serializer.save(clinic=self.request.user.clinic)
