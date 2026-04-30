from rest_framework import generics

from config.mixins import ClinicScopedMixin, DateFilterMixin
from .models import RendezVous
from .serializers import RendezVousSerializer


class RendezVousListCreateView(DateFilterMixin, ClinicScopedMixin, generics.ListCreateAPIView):
    queryset              = RendezVous.objects.select_related('patient', 'medecin')
    serializer_class      = RendezVousSerializer
    search_fields         = ['patient__last_name', 'patient__first_name', 'motif']
    filterset_fields      = ['statut']
    ordering_fields       = ['date_heure', 'statut']
    ordering              = ['date_heure']
    date_filter_field     = 'date_heure'


class RendezVousDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = RendezVous.objects.select_related('patient', 'medecin')
    serializer_class = RendezVousSerializer
