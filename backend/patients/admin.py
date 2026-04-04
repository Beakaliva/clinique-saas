from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display    = ('last_name', 'first_name', 'clinic', 'sexe', 'date_naissance',
                       'get_age', 'telephone', 'est_assure', 'created_at')
    list_filter     = ('clinic', 'sexe', 'est_assure')
    search_fields   = ('last_name', 'first_name', 'telephone', 'code_assurance')
    ordering        = ('last_name', 'first_name')
    readonly_fields = ('get_age', 'created_at', 'updated_at')

    fieldsets = (
        (_('Clinique'), {
            'fields': ('clinic',),
        }),
        (_('Identité'), {
            'fields': ('first_name', 'last_name', 'sexe', 'date_naissance', 'get_age'),
        }),
        (_('Contact'), {
            'fields': ('telephone', 'adresse', 'profession'),
        }),
        (_('Assurance'), {
            'fields': ('est_assure', 'assurance', 'code_assurance', 'pourcentage'),
        }),
        (_('Horodatage'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description=_('Âge'))
    def get_age(self, obj):
        return obj.age
