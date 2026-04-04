from django.db.models import Sum
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from config.mixins import ClinicScopedMixin
from .models import Facture, LigneFacture
from .serializers import FactureSerializer, LigneFactureSerializer


class FactureListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = Facture.objects.select_related('patient', 'caissier')
    serializer_class = FactureSerializer
    search_fields    = ['patient__last_name', 'patient__first_name', 'numero']
    ordering_fields  = ['date', 'statut', 'montant_total']
    ordering         = ['-date']


class FactureDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = Facture.objects.select_related('patient', 'caissier')
    serializer_class = FactureSerializer


class LigneFactureListCreateView(generics.ListCreateAPIView):
    serializer_class = LigneFactureSerializer

    def get_queryset(self):
        return LigneFacture.objects.filter(
            facture__clinic=self.request.user.clinic,
            facture_id=self.kwargs['facture_pk'],
        )

    def perform_create(self, serializer):
        facture = Facture.objects.get(
            pk=self.kwargs['facture_pk'],
            clinic=self.request.user.clinic,
        )
        serializer.save(facture=facture)


class LigneFactureDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LigneFactureSerializer

    def get_queryset(self):
        return LigneFacture.objects.filter(facture__clinic=self.request.user.clinic)


class FactureStatsView(APIView):
    def get(self, request):
        qs = Facture.objects.filter(clinic=request.user.clinic)
        return Response({
            'total':      qs.count(),
            'payees':     qs.filter(statut='payee').count(),
            'en_attente': qs.exclude(statut__in=['payee', 'annulee']).count(),
            'ca_total':   qs.aggregate(s=Sum('montant_total'))['s'] or 0,
            'ca_paye':    qs.aggregate(s=Sum('montant_paye'))['s'] or 0,
        })
