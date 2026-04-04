from rest_framework import generics

from config.mixins import ClinicScopedMixin
from .models import ExamenLabo
from .serializers import ExamenLaboSerializer


class ExamenLaboListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = ExamenLabo.objects.select_related('patient', 'demandeur', 'laborantin')
    serializer_class = ExamenLaboSerializer
    search_fields    = ['patient__last_name', 'patient__first_name', 'type_examen']
    ordering_fields  = ['date_demande', 'statut']
    ordering         = ['-date_demande']


class ExamenLaboDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = ExamenLabo.objects.select_related('patient', 'demandeur', 'laborantin')
    serializer_class = ExamenLaboSerializer
