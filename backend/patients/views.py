from rest_framework import generics, filters, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from config.mixins import ClinicScopedMixin, DateFilterMixin
from .models import Patient
from .serializers import PatientSerializer


class PatientListCreateView(DateFilterMixin, ClinicScopedMixin, generics.ListCreateAPIView):
    queryset              = Patient.objects.all()
    serializer_class      = PatientSerializer
    search_fields         = ['last_name', 'first_name', 'telephone', 'code_assurance']
    filterset_fields      = ['sexe', 'est_assure']
    ordering_fields       = ['last_name', 'first_name', 'date_naissance', 'created_at']
    ordering              = ['last_name', 'first_name']
    date_filter_field     = 'created_at'


class PatientDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = Patient.objects.all()
    serializer_class = PatientSerializer


class PatientAssuresView(ClinicScopedMixin, generics.ListAPIView):
    serializer_class = PatientSerializer

    def get_queryset(self):
        return super().get_queryset().filter(est_assure=True)


class PatientStatsView(APIView):
    def get(self, request):
        qs = Patient.objects.filter(clinic=request.user.clinic)
        return Response({
            'total':       qs.count(),
            'assures':     qs.filter(est_assure=True).count(),
            'non_assures': qs.filter(est_assure=False).count(),
            'masculins':   qs.filter(sexe='M').count(),
            'feminins':    qs.filter(sexe='F').count(),
        })
