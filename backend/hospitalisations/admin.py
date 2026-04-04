from django.contrib import admin
from .models import Hospitalisation


@admin.register(Hospitalisation)
class HospitalisationAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'medecin', 'clinic', 'chambre', 'date_entree', 'statut')
    list_filter   = ('statut', 'clinic')
    search_fields = ('patient__last_name', 'patient__first_name', 'chambre')
    ordering      = ('-date_entree',)
