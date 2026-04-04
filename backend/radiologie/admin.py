from django.contrib import admin
from .models import ExamenRadio


@admin.register(ExamenRadio)
class ExamenRadioAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'type_examen', 'clinic', 'date', 'statut')
    list_filter   = ('statut', 'clinic')
    search_fields = ('patient__last_name', 'patient__first_name', 'type_examen')
    ordering      = ('-date',)
