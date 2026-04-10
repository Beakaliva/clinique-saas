from datetime import date

from rest_framework import generics, filters
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from config.mixins import ClinicScopedMixin
from .models import Soin, SoinActe
from .serializers import SoinSerializer, SoinActeSerializer


class SoinListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = Soin.objects.select_related('patient', 'infirmier', 'consultation').prefetch_related('actes')
    serializer_class = SoinSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['consultation', 'statut', 'patient']
    search_fields    = ['patient__last_name', 'patient__first_name', 'type_soin']
    ordering_fields  = ['date', 'statut']
    ordering         = ['-date']


class SoinDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = Soin.objects.select_related('patient', 'infirmier', 'consultation').prefetch_related('actes')
    serializer_class = SoinSerializer


class SoinActeListCreateView(generics.ListCreateAPIView):
    """Actes d'un soin donné. Vérifie que le soin appartient à la clinique."""
    serializer_class = SoinActeSerializer

    def _get_soin(self):
        soin = generics.get_object_or_404(Soin, pk=self.kwargs['soin_pk'])
        if soin.clinic != self.request.user.clinic:
            raise PermissionDenied
        return soin

    def get_queryset(self):
        return SoinActe.objects.filter(soin=self._get_soin())

    def perform_create(self, serializer):
        serializer.save(soin=self._get_soin())


class SoinActeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SoinActeSerializer

    def get_queryset(self):
        soin = generics.get_object_or_404(Soin, pk=self.kwargs['soin_pk'])
        if soin.clinic != self.request.user.clinic:
            raise PermissionDenied
        return SoinActe.objects.filter(soin=soin)


class FacturerSoinView(APIView):
    """Génère (ou retourne) la facture liée à un soin."""

    def post(self, request, pk):
        from factures.models import Facture, LigneFacture
        from factures.serializers import FactureSerializer
        from factures.views import FactureListCreateView

        soin = generics.get_object_or_404(Soin, pk=pk, clinic=request.user.clinic)

        # Facture déjà existante → on la retourne
        if hasattr(soin, 'facture') and soin.facture is not None:
            serializer = FactureSerializer(soin.facture)
            return Response({'created': False, 'facture': serializer.data})

        # Calcul assurance
        patient = soin.patient
        montant = float(soin.montant_total)
        extra = {}
        if patient.est_assure:
            taux = float(patient.pourcentage or 0)
            part_ass = round(montant * taux / 100, 2)
            extra = {
                'est_assure': True, 'taux_assurance': taux,
                'assurance_nom': patient.assurance or '',
                'assurance_code': patient.code_assurance or '',
                'part_assurance': part_ass,
                'part_patient': round(montant - part_ass, 2),
            }
        else:
            extra = {'est_assure': False, 'taux_assurance': 0,
                     'part_assurance': 0, 'part_patient': montant}

        # Génération du numéro
        numero = FactureListCreateView._generate_numero(request.user.clinic)

        facture = Facture.objects.create(
            clinic=request.user.clinic,
            patient=patient,
            soin=soin,
            numero=numero,
            date=soin.date.date() if hasattr(soin.date, 'date') else date.today(),
            statut=Facture.Statut.EMISE,
            montant_total=montant,
            **extra,
        )

        # Créer les lignes depuis les actes du soin
        for acte in soin.actes.all():
            LigneFacture.objects.create(
                facture=facture,
                description=acte.acte,
                quantite=acte.qte,
                prix_unitaire=acte.prix,
            )

        serializer = FactureSerializer(facture)
        return Response({'created': True, 'facture': serializer.data}, status=201)
