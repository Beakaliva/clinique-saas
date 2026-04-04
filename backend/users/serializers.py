from django.contrib.auth import authenticate
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .clinic_config import CLINIC_TYPE_CHOICES, get_preset
from .models import Clinic, Permission, User


# ---------------------------------------------------------------------------
# Clinic
# ---------------------------------------------------------------------------

class ClinicSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model  = Clinic
        fields = (
            "id", "name", "type", "type_display", "slug",
            "telephone", "adresse", "email", "logo",
            "is_active", "created_at",
        )
        read_only_fields = ("slug", "created_at")


class ClinicLightSerializer(serializers.ModelSerializer):
    """Version légère pour l'imbrication dans UserSerializer."""
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model  = Clinic
        fields = ("id", "name", "type", "type_display", "slug")


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    full_name    = serializers.CharField(source="get_full_name", read_only=True)
    clinic       = ClinicLightSerializer(read_only=True)
    clinic_groups  = serializers.SerializerMethodField()
    clinic_modules = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = (
            "id", "telephone", "first_name", "last_name", "email",
            "avatar", "full_name",
            "clinic", "clinic_groups", "clinic_modules",
            "group", "permission", "modules",
            "is_active", "is_staff", "is_superuser",
            "created_at", "updated_at",
        )
        read_only_fields = ("is_superuser", "created_at", "updated_at")

    def get_clinic_groups(self, obj):
        """Groupes disponibles pour le type de clinique de cet utilisateur."""
        return obj.clinic.available_groups

    def get_clinic_modules(self, obj):
        """Modules disponibles pour le type de clinique de cet utilisateur."""
        return obj.clinic.available_modules


class UserCreateSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label=_("Confirmation"))

    class Meta:
        model  = User
        fields = ("telephone", "first_name", "last_name", "email",
                  "group", "permission", "modules", "password", "password2")

    def validate(self, data):
        if data["password"] != data.pop("password2"):
            raise serializers.ValidationError({"password2": _("Les mots de passe ne correspondent pas.")})
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ("first_name", "last_name", "email", "avatar",
                  "group", "permission", "modules", "is_active", "is_staff")


# ---------------------------------------------------------------------------
# Inscription SaaS — crée la clinique + le premier admin en une seule requête
# ---------------------------------------------------------------------------

class RegisterSerializer(serializers.Serializer):
    # ── Clinique ──────────────────────────────────────────────────────────
    clinic_name      = serializers.CharField(max_length=200, label=_("Nom de la clinique"))
    clinic_type      = serializers.ChoiceField(choices=CLINIC_TYPE_CHOICES, label=_("Type de clinique"))
    clinic_telephone = serializers.CharField(max_length=30, required=False, allow_blank=True, label=_("Téléphone de la clinique"))
    clinic_adresse   = serializers.CharField(max_length=255, required=False, allow_blank=True, label=_("Adresse"))
    clinic_email     = serializers.EmailField(required=False, allow_blank=True, label=_("Email de la clinique"))

    # ── Administrateur ────────────────────────────────────────────────────
    telephone  = serializers.CharField(max_length=30, label=_("Votre téléphone"))
    first_name = serializers.CharField(max_length=100, label=_("Prénom"))
    last_name  = serializers.CharField(max_length=100, label=_("Nom"))
    email      = serializers.EmailField(required=False, allow_blank=True, label=_("Votre email"))
    password   = serializers.CharField(write_only=True, min_length=8, label=_("Mot de passe"))
    password2  = serializers.CharField(write_only=True, label=_("Confirmation"))

    def validate_telephone(self, value):
        if User.objects.filter(telephone=value).exists():
            raise serializers.ValidationError(_("Ce numéro de téléphone est déjà utilisé."))
        return value

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": _("Les mots de passe ne correspondent pas.")})
        return data

    @transaction.atomic
    def create(self, validated_data):
        # 1. Créer la clinique
        preset   = get_preset(validated_data["clinic_type"])
        admin_group = next(
            (code for code, _ in preset["groups"] if code == "ADMIN"),
            preset["groups"][0][0],
        )

        clinic = Clinic.objects.create(
            name      = validated_data["clinic_name"],
            type      = validated_data["clinic_type"],
            telephone = validated_data.get("clinic_telephone", ""),
            adresse   = validated_data.get("clinic_adresse", ""),
            email     = validated_data.get("clinic_email", ""),
        )

        # 2. Créer le premier utilisateur (admin de la clinique)
        user = User(
            clinic     = clinic,
            telephone  = validated_data["telephone"],
            first_name = validated_data["first_name"],
            last_name  = validated_data["last_name"],
            email      = validated_data.get("email", ""),
            group      = admin_group,
            permission = Permission.CRUD,
            modules    = [code for code, _ in preset["modules"]],
            is_staff   = True,
        )
        user.set_password(validated_data["password"])
        user.save()

        return clinic, user


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class ChangePasswordSerializer(serializers.Serializer):
    old_password  = serializers.CharField(write_only=True)
    new_password  = serializers.CharField(write_only=True, min_length=8)
    new_password2 = serializers.CharField(write_only=True, label=_("Confirmation"))

    def validate(self, data):
        if data["new_password"] != data["new_password2"]:
            raise serializers.ValidationError({"new_password2": _("Les mots de passe ne correspondent pas.")})
        return data


class LoginSerializer(serializers.Serializer):
    telephone = serializers.CharField(label=_("Téléphone"))
    password  = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["telephone"], password=data["password"])
        if not user:
            raise serializers.ValidationError(_("Téléphone ou mot de passe incorrect."))
        if not user.is_active:
            raise serializers.ValidationError(_("Ce compte est désactivé."))
        if not user.clinic.is_active:
            raise serializers.ValidationError(_("Cette clinique est désactivée."))
        data["user"] = user
        return data
