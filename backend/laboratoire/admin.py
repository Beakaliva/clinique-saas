from django.contrib import admin
from .models import ExamenLabo


@admin.register(ExamenLabo)
class ExamenLaboAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'type_examen', 'clinic', 'date_demande', 'statut')
    list_filter   = ('statut', 'clinic')
    search_fields = ('patient__last_name', 'patient__first_name', 'type_examen')
    ordering      = ('-date_demande',)
