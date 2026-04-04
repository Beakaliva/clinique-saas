from django.urls import path
from .views import (
    MedicamentListCreateView, MedicamentDetailView,
    MouvementStockListCreateView,
)

app_name = 'pharmacie'

urlpatterns = [
    path('',                                          MedicamentListCreateView.as_view(),    name='list'),
    path('<int:pk>/',                                 MedicamentDetailView.as_view(),        name='detail'),
    path('<int:medicament_pk>/mouvements/',            MouvementStockListCreateView.as_view(), name='mouvement-list'),
]
