from rest_framework import generics

from config.mixins import ClinicScopedMixin
from .models import Antecedent, DossierMedical
from .serializers import AntecedentSerializer, DossierMedicalSerializer


class DossierListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = DossierMedical.objects.select_related('patient')
    serializer_class = DossierMedicalSerializer
    search_fields    = ['patient__last_name', 'patient__first_name']
    ordering         = ['patient__last_name']


class DossierDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = DossierMedical.objects.select_related('patient')
    serializer_class = DossierMedicalSerializer


class AntecedentListCreateView(generics.ListCreateAPIView):
    serializer_class = AntecedentSerializer

    def get_queryset(self):
        return Antecedent.objects.filter(
            dossier__clinic=self.request.user.clinic,
            dossier_id=self.kwargs['dossier_pk'],
        )

    def perform_create(self, serializer):
        dossier = DossierMedical.objects.get(
            pk=self.kwargs['dossier_pk'],
            clinic=self.request.user.clinic,
        )
        serializer.save(dossier=dossier)


class AntecedentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AntecedentSerializer

    def get_queryset(self):
        return Antecedent.objects.filter(dossier__clinic=self.request.user.clinic)
