from django.urls import path
from .views import (
    DossierListCreateView, DossierDetailView, DossierByPatientView,
    AntecedentListCreateView, AntecedentDetailView,
)

app_name = 'dossiers'

urlpatterns = [
    path('',                                        DossierListCreateView.as_view(),    name='list'),
    path('patient/<int:patient_id>/',               DossierByPatientView.as_view(),     name='by-patient'),
    path('<int:pk>/',                               DossierDetailView.as_view(),        name='detail'),
    path('<int:dossier_pk>/antecedents/',            AntecedentListCreateView.as_view(), name='antecedent-list'),
    path('<int:dossier_pk>/antecedents/<int:pk>/',   AntecedentDetailView.as_view(),     name='antecedent-detail'),
]
