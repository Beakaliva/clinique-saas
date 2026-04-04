from rest_framework import generics

from config.mixins import ClinicScopedMixin
from .models import Hospitalisation
from .serializers import HospitalisationSerializer


class HospitalisationListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = Hospitalisation.objects.select_related('patient', 'medecin')
    serializer_class = HospitalisationSerializer
    search_fields    = ['patient__last_name', 'patient__first_name', 'chambre', 'motif']
    ordering_fields  = ['date_entree', 'statut']
    ordering         = ['-date_entree']


class HospitalisationDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = Hospitalisation.objects.select_related('patient', 'medecin')
    serializer_class = HospitalisationSerializer
