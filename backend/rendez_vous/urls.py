from django.urls import path
from .views import RendezVousListCreateView, RendezVousDetailView

app_name = 'rendez_vous'

urlpatterns = [
    path('',          RendezVousListCreateView.as_view(), name='list'),
    path('<int:pk>/', RendezVousDetailView.as_view(),     name='detail'),
]
