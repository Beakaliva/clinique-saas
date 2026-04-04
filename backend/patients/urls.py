from django.urls import path

from .views import (
    PatientListCreateView,
    PatientDetailView,
    PatientAssuresView,
    PatientStatsView,
)

app_name = 'patients'

urlpatterns = [
    path('',          PatientListCreateView.as_view(), name='patient-list'),
    path('<int:pk>/', PatientDetailView.as_view(),     name='patient-detail'),
    path('assures/',  PatientAssuresView.as_view(),    name='patient-assures'),
    path('stats/',    PatientStatsView.as_view(),      name='patient-stats'),
]
