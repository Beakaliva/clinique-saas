from django.urls import path
from .views import SoinListCreateView, SoinDetailView

app_name = 'soins'

urlpatterns = [
    path('',          SoinListCreateView.as_view(), name='list'),
    path('<int:pk>/', SoinDetailView.as_view(),     name='detail'),
]
