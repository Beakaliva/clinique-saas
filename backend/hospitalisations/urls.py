from django.urls import path
from .views import HospitalisationListCreateView, HospitalisationDetailView

app_name = 'hospitalisations'

urlpatterns = [
    path('',          HospitalisationListCreateView.as_view(), name='list'),
    path('<int:pk>/', HospitalisationDetailView.as_view(),     name='detail'),
]
