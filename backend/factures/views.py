from datetime import date

from django.db.models import Sum
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from config.mixins import ClinicScopedMixin, DateFilterMixin
from .models import Facture, LigneFacture, Paiement
from .serializers import FactureSerializer, LigneFactureSerializer, PaiementSerializer


class FactureListCreateView(DateFilterMixin, ClinicScopedMixin, generics.ListCreateAPIView):
    queryset                  = Facture.objects.select_related('patient', 'caissier').prefetch_related('lignes', 'paiements')
    serializer_class          = FactureSerializer
    search_fields             = ['patient__last_name', 'patient__first_name', 'numero']
    filterset_fields          = ['statut']
    ordering_fields           = ['date', 'statut', 'montant_total']
    ordering                  = ['-date']
    date_filter_field         = 'date'
    date_filter_is_date_field = True

    @staticmethod
    def _generate_numero(clinic):
        """Génère FAC-YYYY-NNNN unique pour la clinique."""
        year  = date.today().year
        count = Facture.objects.filter(clinic=clinic, date__year=year).count() + 1
        while True:
            numero = f"FAC-{year}-{count:04d}"
            if not Facture.objects.filter(numero=numero).exists():
                return numero
            count += 1

    def perform_create(self, serializer):
        """Auto-remplit les champs assurance depuis le patient si assuré."""
        clinic  = self.request.user.clinic
        numero  = self._generate_numero(clinic)
        patient = serializer.validated_data.get('patient')
        extra = {}
        if patient and patient.est_assure:
            montant = serializer.validated_data.get('montant_total', 0)
            taux = float(patient.pourcentage or 0)
            part_ass = round(float(montant) * taux / 100, 2)
            extra = {
                'est_assure':     True,
                'taux_assurance': taux,
                'assurance_nom':  patient.assurance or '',
                'assurance_code': patient.code_assurance or '',
                'part_assurance': part_ass,
                'part_patient':   round(float(montant) - part_ass, 2),
            }
        else:
            montant = serializer.validated_data.get('montant_total', 0)
            extra = {
                'est_assure':     False,
                'taux_assurance': 0,
                'part_assurance': 0,
                'part_patient':   float(montant),
            }
        serializer.save(clinic=clinic, numero=numero, **extra)


class FactureDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = Facture.objects.select_related('patient', 'caissier').prefetch_related('lignes', 'paiements')
    serializer_class = FactureSerializer


class LigneFactureListCreateView(generics.ListCreateAPIView):
    serializer_class = LigneFactureSerializer

    def get_queryset(self):
        return LigneFacture.objects.filter(
            facture__clinic=self.request.user.clinic,
            facture_id=self.kwargs['facture_pk'],
        )

    def perform_create(self, serializer):
        facture = Facture.objects.get(pk=self.kwargs['facture_pk'], clinic=self.request.user.clinic)
        serializer.save(facture=facture)


class LigneFactureDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LigneFactureSerializer

    def get_queryset(self):
        return LigneFacture.objects.filter(facture__clinic=self.request.user.clinic)


class PaiementListCreateView(generics.ListCreateAPIView):
    serializer_class = PaiementSerializer

    def get_queryset(self):
        return Paiement.objects.filter(
            facture__clinic=self.request.user.clinic,
            facture_id=self.kwargs['facture_pk'],
        )

    def perform_create(self, serializer):
        facture = Facture.objects.get(pk=self.kwargs['facture_pk'], clinic=self.request.user.clinic)
        montant = serializer.validated_data['montant']
        payeur  = serializer.validated_data.get('payeur', 'patient')

        # Validation : le montant ne doit pas dépasser le restant dû
        if facture.est_assure:
            restant = facture.montant_restant_assurance if payeur == 'assurance' else facture.montant_restant_patient
            label   = "l'assurance" if payeur == 'assurance' else "le patient"
        else:
            restant = facture.montant_restant
            label   = "le patient"

        if montant > restant:
            raise ValidationError(
                {'montant': f'Le montant ({montant} GNF) dépasse le restant dû pour {label} ({restant} GNF).'}
            )

        paiement = serializer.save(facture=facture, caissier=self.request.user)
        # Mise à jour automatique du statut
        total_paye = facture.montant_paye
        if total_paye >= facture.montant_total:
            facture.statut = Facture.Statut.PAYEE
        elif total_paye > 0:
            facture.statut = Facture.Statut.PARTIELLE
        facture.save(update_fields=['statut'])
        return paiement


class PaiementDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = PaiementSerializer

    def get_queryset(self):
        return Paiement.objects.filter(facture__clinic=self.request.user.clinic)

    def perform_destroy(self, instance):
        facture = instance.facture
        instance.delete()
        # Recalculer le statut
        total_paye = facture.montant_paye
        if total_paye <= 0:
            facture.statut = Facture.Statut.EMISE
        elif total_paye < facture.montant_total:
            facture.statut = Facture.Statut.PARTIELLE
        facture.save(update_fields=['statut'])


class FactureStatsView(APIView):
    def get(self, request):
        qs = Facture.objects.filter(clinic=request.user.clinic)
        return Response({
            'total':      qs.count(),
            'payees':     qs.filter(statut='payee').count(),
            'en_attente': qs.exclude(statut__in=['payee', 'annulee']).count(),
            'ca_total':   qs.aggregate(s=Sum('montant_total'))['s'] or 0,
        })
