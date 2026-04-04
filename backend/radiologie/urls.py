from django.urls import path
from .views import ExamenRadioListCreateView, ExamenRadioDetailView

app_name = 'radiologie'

urlpatterns = [
    path('',          ExamenRadioListCreateView.as_view(), name='list'),
    path('<int:pk>/', ExamenRadioDetailView.as_view(),     name='detail'),
]
