from django.contrib import admin
from .models import Consultation


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'medecin', 'clinic', 'date', 'motif', 'statut')
    list_filter   = ('statut', 'clinic')
    search_fields = ('patient__last_name', 'patient__first_name', 'motif', 'diagnostic')
    ordering      = ('-date',)
