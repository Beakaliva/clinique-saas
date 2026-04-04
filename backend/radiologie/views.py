from rest_framework import generics

from config.mixins import ClinicScopedMixin
from .models import ExamenRadio
from .serializers import ExamenRadioSerializer


class ExamenRadioListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = ExamenRadio.objects.select_related('patient', 'demandeur', 'radiologue')
    serializer_class = ExamenRadioSerializer
    search_fields    = ['patient__last_name', 'patient__first_name', 'type_examen']
    ordering_fields  = ['date', 'statut']
    ordering         = ['-date']


class ExamenRadioDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = ExamenRadio.objects.select_related('patient', 'demandeur', 'radiologue')
    serializer_class = ExamenRadioSerializer
