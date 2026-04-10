from django.urls import path

from .views import SoinListCreateView, SoinDetailView, SoinActeListCreateView, SoinActeDetailView, FacturerSoinView

app_name = 'soins'

urlpatterns = [
    path('',                                  SoinListCreateView.as_view(),    name='list'),
    path('<int:pk>/',                         SoinDetailView.as_view(),        name='detail'),
    path('<int:pk>/facturer/',                FacturerSoinView.as_view(),      name='facturer'),
    path('<int:soin_pk>/actes/',              SoinActeListCreateView.as_view(), name='actes-list'),
    path('<int:soin_pk>/actes/<int:pk>/',     SoinActeDetailView.as_view(),    name='actes-detail'),
]
