from django.urls import path
from .views import ExamenLaboListCreateView, ExamenLaboDetailView

app_name = 'laboratoire'

urlpatterns = [
    path('',          ExamenLaboListCreateView.as_view(), name='list'),
    path('<int:pk>/', ExamenLaboDetailView.as_view(),     name='detail'),
]
