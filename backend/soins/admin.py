from django.contrib import admin
from .models import Soin


@admin.register(Soin)
class SoinAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'infirmier', 'clinic', 'type_soin', 'date', 'statut')
    list_filter   = ('statut', 'clinic')
    search_fields = ('patient__last_name', 'patient__first_name', 'type_soin')
    ordering      = ('-date',)
