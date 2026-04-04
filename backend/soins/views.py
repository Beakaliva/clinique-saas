from rest_framework import generics

from config.mixins import ClinicScopedMixin
from .models import Soin
from .serializers import SoinSerializer


class SoinListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = Soin.objects.select_related('patient', 'infirmier')
    serializer_class = SoinSerializer
    search_fields    = ['patient__last_name', 'patient__first_name', 'type_soin']
    ordering_fields  = ['date', 'statut']
    ordering         = ['-date']


class SoinDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = Soin.objects.select_related('patient', 'infirmier')
    serializer_class = SoinSerializer
