from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):

    def _create_user(self, telephone, password, **extra_fields):
        if not telephone:
            raise ValueError("Le numéro de téléphone est obligatoire.")

        # Si aucune clinique fournie, on en crée une par défaut (utile pour createsuperuser)
        if not extra_fields.get("clinic"):
            from .models import Clinic
            clinic, _ = Clinic.objects.get_or_create(
                slug="plateforme",
                defaults={
                    "name": "Plateforme",
                    "type": "generale",
                },
            )
            extra_fields["clinic"] = clinic

        user = self.model(telephone=telephone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, telephone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(telephone, password, **extra_fields)

    def create_superuser(self, telephone, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("group", "ADMIN")
        extra_fields.setdefault("permission", "CRUD")

        if not extra_fields.get("is_staff"):
            raise ValueError("Le superutilisateur doit avoir is_staff=True.")
        if not extra_fields.get("is_superuser"):
            raise ValueError("Le superutilisateur doit avoir is_superuser=True.")

        return self._create_user(telephone, password, **extra_fields)
