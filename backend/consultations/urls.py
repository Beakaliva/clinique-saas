from django.urls import path
from .views import ConsultationListCreateView, ConsultationDetailView

app_name = 'consultations'

urlpatterns = [
    path('',          ConsultationListCreateView.as_view(), name='list'),
    path('<int:pk>/', ConsultationDetailView.as_view(),     name='detail'),
]
