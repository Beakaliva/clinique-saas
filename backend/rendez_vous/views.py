from rest_framework import generics

from config.mixins import ClinicScopedMixin
from .models import RendezVous
from .serializers import RendezVousSerializer


class RendezVousListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = RendezVous.objects.select_related('patient', 'medecin')
    serializer_class = RendezVousSerializer
    search_fields    = ['patient__last_name', 'patient__first_name', 'motif']
    ordering_fields  = ['date_heure', 'statut']
    ordering         = ['date_heure']


class RendezVousDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = RendezVous.objects.select_related('patient', 'medecin')
    serializer_class = RendezVousSerializer
