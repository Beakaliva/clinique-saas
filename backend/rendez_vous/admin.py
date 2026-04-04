from django.contrib import admin
from .models import RendezVous


@admin.register(RendezVous)
class RendezVousAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'medecin', 'clinic', 'date_heure', 'duree_minutes', 'motif', 'statut')
    list_filter   = ('statut', 'clinic')
    search_fields = ('patient__last_name', 'patient__first_name', 'motif')
    ordering      = ('date_heure',)
