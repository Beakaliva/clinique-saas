from django.urls import path
from .views import (
    OrdonnanceListCreateView, OrdonnanceDetailView,
    LigneOrdonnanceListCreateView, LigneOrdonnanceDetailView,
)

app_name = 'ordonnances'

urlpatterns = [
    path('',                                          OrdonnanceListCreateView.as_view(),      name='list'),
    path('<int:pk>/',                                 OrdonnanceDetailView.as_view(),           name='detail'),
    path('<int:ordonnance_pk>/lignes/',                LigneOrdonnanceListCreateView.as_view(), name='ligne-list'),
    path('<int:ordonnance_pk>/lignes/<int:pk>/',       LigneOrdonnanceDetailView.as_view(),     name='ligne-detail'),
]
