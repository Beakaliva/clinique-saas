from itertools import chain

from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .clinic_config import PRESETS
from .models import Clinic, User


# Tous les groupes et modules possibles (union de tous les presets)
_ALL_GROUPS = list({
    code: label
    for code, label in chain.from_iterable(p["groups"] for p in PRESETS.values())
}.items())

_ALL_MODULES = list({
    code: label
    for code, label in chain.from_iterable(p["modules"] for p in PRESETS.values())
}.items())


# ---------------------------------------------------------------------------
# Clinic
# ---------------------------------------------------------------------------

@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    list_display    = ("name", "type", "slug", "telephone", "is_active", "created_at")
    list_filter     = ("type", "is_active")
    search_fields   = ("name", "slug", "telephone", "email")
    readonly_fields = ("slug", "created_at", "updated_at")

    fieldsets = (
        (None, {
            "fields": ("name", "type", "slug", "is_active"),
        }),
        (_("Coordonnées"), {
            "fields": ("telephone", "adresse", "email", "logo"),
        }),
        (_("Horodatage"), {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class UserAdminForm(forms.ModelForm):
    group = forms.ChoiceField(
        choices=[("", "— Sélectionner un groupe —")] + _ALL_GROUPS,
        label="Groupe",
    )
    modules = forms.MultipleChoiceField(
        choices=_ALL_MODULES,
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label="Modules accessibles",
    )

    class Meta:
        model  = User
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        instance = kwargs.get("instance")
        # Restreindre aux choices de la clinique si on édite un user existant
        if instance and instance.clinic_id:
            self.fields["group"].choices   = instance.clinic.available_groups
            self.fields["modules"].choices = instance.clinic.available_modules

    def clean_modules(self):
        return self.cleaned_data.get("modules", [])

    def clean_group(self):
        group    = self.cleaned_data.get("group")
        clinic   = self.cleaned_data.get("clinic")
        if clinic and group:
            valid = [code for code, _ in clinic.available_groups]
            if group not in valid:
                raise forms.ValidationError(
                    f"Ce groupe n'existe pas pour une clinique de type « {clinic.get_type_display()} »."
                )
        return group


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form          = UserAdminForm
    ordering      = ("clinic", "last_name", "first_name")
    list_display  = ("telephone", "first_name", "last_name", "clinic", "group", "permission", "is_active")
    list_filter   = ("is_active", "is_staff", "is_superuser", "permission", "clinic__type")
    search_fields = ("telephone", "first_name", "last_name", "email", "clinic__name")

    fieldsets = (
        (None, {
            "fields": ("telephone", "password"),
        }),
        (_("Informations personnelles"), {
            "fields": ("first_name", "last_name", "email", "avatar"),
        }),
        (_("Clinique & droits"), {
            "fields": ("clinic", "group", "permission", "modules"),
        }),
        (_("Accès système"), {
            "fields": ("is_active", "is_staff", "is_superuser"),
        }),
        (_("Horodatage"), {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("clinic", "telephone", "first_name", "last_name",
                       "password1", "password2", "group", "permission"),
        }),
    )

    readonly_fields   = ("created_at", "updated_at")
    filter_horizontal = ()
