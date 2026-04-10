from django.urls import path
from .views import (
    FactureListCreateView, FactureDetailView,
    LigneFactureListCreateView, LigneFactureDetailView,
    PaiementListCreateView, PaiementDetailView,
    FactureStatsView,
)

app_name = 'factures'

urlpatterns = [
    path('',                                          FactureListCreateView.as_view(),      name='list'),
    path('stats/',                                    FactureStatsView.as_view(),           name='stats'),
    path('<int:pk>/',                                 FactureDetailView.as_view(),          name='detail'),
    path('<int:facture_pk>/lignes/',                  LigneFactureListCreateView.as_view(), name='ligne-list'),
    path('<int:facture_pk>/lignes/<int:pk>/',         LigneFactureDetailView.as_view(),     name='ligne-detail'),
    path('<int:facture_pk>/paiements/',               PaiementListCreateView.as_view(),     name='paiement-list'),
    path('<int:facture_pk>/paiements/<int:pk>/',      PaiementDetailView.as_view(),         name='paiement-detail'),
]
