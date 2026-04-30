from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend

from config.mixins import ClinicScopedMixin, DateFilterMixin
from .models import LigneOrdonnance, Ordonnance
from .serializers import LigneOrdonnanceSerializer, OrdonnanceSerializer


class OrdonnanceListCreateView(DateFilterMixin, ClinicScopedMixin, generics.ListCreateAPIView):
    queryset                  = Ordonnance.objects.select_related('patient', 'medecin').prefetch_related('lignes')
    serializer_class          = OrdonnanceSerializer
    filter_backends           = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields          = ['patient', 'consultation']
    search_fields             = ['patient__last_name', 'patient__first_name']
    ordering_fields           = ['date']
    ordering                  = ['-date']
    date_filter_field         = 'date'
    date_filter_is_date_field = True


class OrdonnanceDetailView(ClinicScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset         = Ordonnance.objects.select_related('patient', 'medecin').prefetch_related('lignes')
    serializer_class = OrdonnanceSerializer


class LigneOrdonnanceListCreateView(generics.ListCreateAPIView):
    serializer_class = LigneOrdonnanceSerializer

    def get_queryset(self):
        return LigneOrdonnance.objects.filter(
            ordonnance__clinic=self.request.user.clinic,
            ordonnance_id=self.kwargs['ordonnance_pk'],
        )

    def perform_create(self, serializer):
        ordonnance = Ordonnance.objects.get(
            pk=self.kwargs['ordonnance_pk'],
            clinic=self.request.user.clinic,
        )
        serializer.save(ordonnance=ordonnance)


class LigneOrdonnanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LigneOrdonnanceSerializer

    def get_queryset(self):
        return LigneOrdonnance.objects.filter(ordonnance__clinic=self.request.user.clinic)
