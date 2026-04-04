from rest_framework import generics

from config.mixins import ClinicScopedMixin
from .models import Medicament, MouvementStock
from .serializers import MedicamentSerializer, MouvementStockSerializer


class MedicamentListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = Medicament.objects.all()
    serializer_class = MedicamentSerializer
    search_fields    = ['nom', 'dosage']
    ordering_fields  = ['nom', 'stock_actuel']
    ordering         = ['nom']


class MedicamentDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = Medicament.objects.all()
    serializer_class = MedicamentSerializer


class MouvementStockListCreateView(generics.ListCreateAPIView):
    serializer_class = MouvementStockSerializer

    def get_queryset(self):
        return MouvementStock.objects.filter(
            medicament__clinic=self.request.user.clinic,
            medicament_id=self.kwargs['medicament_pk'],
        )

    def perform_create(self, serializer):
        medicament = Medicament.objects.get(
            pk=self.kwargs['medicament_pk'],
            clinic=self.request.user.clinic,
        )
        mouvement = serializer.save(medicament=medicament, user=self.request.user)
        # Mettre à jour le stock
        if mouvement.type == 'entree':
            medicament.stock_actuel += mouvement.quantite
        elif mouvement.type == 'sortie':
            medicament.stock_actuel -= mouvement.quantite
        else:
            medicament.stock_actuel = mouvement.quantite
        medicament.save()
