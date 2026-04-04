from rest_framework import generics
from rest_framework.exceptions import PermissionDenied

from config.mixins import ClinicScopedMixin
from .models import Soin, SoinActe
from .serializers import SoinSerializer, SoinActeSerializer


class SoinListCreateView(ClinicScopedMixin, generics.ListCreateAPIView):
    queryset         = Soin.objects.select_related('patient', 'infirmier', 'consultation').prefetch_related('actes')
    serializer_class = SoinSerializer
    search_fields    = ['patient__last_name', 'patient__first_name', 'type_soin']
    filterset_fields = ['consultation', 'statut', 'patient']
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
