from rest_framework import generics

from config.mixins import ClinicScopedMixin
from .models import Consultation
from .serializers import ConsultationSerializer


class ConsultationListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = Consultation.objects.select_related('patient', 'medecin')
    serializer_class = ConsultationSerializer
    search_fields    = ['patient__last_name', 'patient__first_name', 'motif', 'diagnostic']
    filterset_fields = ['patient', 'statut']
    ordering_fields  = ['date', 'statut']
    ordering         = ['-date']


class ConsultationDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = Consultation.objects.select_related('patient', 'medecin')
    serializer_class = ConsultationSerializer
