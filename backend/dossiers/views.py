from rest_framework import generics, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from config.mixins import ClinicScopedMixin
from patients.models import Patient
from .models import Antecedent, DossierMedical
from .serializers import AntecedentSerializer, DossierMedicalSerializer


class DossierListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = DossierMedical.objects.select_related('patient').prefetch_related('liste_antecedents')
    serializer_class = DossierMedicalSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['patient']
    search_fields    = ['patient__last_name', 'patient__first_name']
    ordering         = ['patient__last_name']


class DossierDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = DossierMedical.objects.select_related('patient').prefetch_related('liste_antecedents')
    serializer_class = DossierMedicalSerializer


class DossierByPatientView(generics.GenericAPIView):
    """Retourne ou crée le dossier d'un patient. GET /dossiers/patient/<patient_id>/"""
    serializer_class = DossierMedicalSerializer

    def get(self, request, patient_id):
        patient = generics.get_object_or_404(Patient, pk=patient_id, clinic=request.user.clinic)
        dossier, _ = DossierMedical.objects.get_or_create(
            patient=patient,
            defaults={'clinic': request.user.clinic},
        )
        # Recharger avec prefetch
        dossier = DossierMedical.objects.select_related('patient').prefetch_related('liste_antecedents').get(pk=dossier.pk)
        return Response(DossierMedicalSerializer(dossier).data)


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
