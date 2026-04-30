from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count
from django.db.models.functions import ExtractMonth, ExtractYear
from django.utils import timezone
import datetime

from .emails import send_welcome_email
from .models import Clinic, User
from .serializers import (
    ClinicSerializer,
    RegisterSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    LoginSerializer,
)
from .permissions import IsAdminOrSuperuser, IsSelfOrAdmin, IsSuperuser


# ---------------------------------------------------------------------------
# Inscription SaaS
# ---------------------------------------------------------------------------

class RegisterView(APIView):
    """
    POST /api/auth/register/
    Crée une clinique + son premier administrateur en une seule requête.
    Retourne les tokens JWT immédiatement.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        clinic, user = serializer.save()

        # Envoyer l'email de bienvenue en arrière-plan
        send_welcome_email(user, clinic)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access":  str(refresh.access_token),
            "refresh": str(refresh),
            "clinic":  ClinicSerializer(clinic).data,
            "user":    UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class LoginView(APIView):
    """POST /api/auth/login/"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        return Response({
            "access":  str(refresh.access_token),
            "refresh": str(refresh),
            "user":    UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """POST /api/auth/logout/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data["refresh"])
            token.blacklist()
        except Exception:
            pass
        return Response({"detail": "Déconnecté avec succès."}, status=status.HTTP_200_OK)


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/"""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"old_password": "Mot de passe actuel incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Mot de passe modifié avec succès."})


class AdminResetPasswordView(APIView):
    """
    POST /api/users/<id>/reset-password/
    Réservé aux admins — permet de définir un nouveau mot de passe pour
    n'importe quel utilisateur de la même clinique sans connaître l'ancien.
    Body: { new_password: str, new_password2: str }
    """
    permission_classes = [IsAdminOrSuperuser]

    def post(self, request, pk):
        # Vérifier que l'utilisateur cible appartient à la même clinique
        try:
            target = User.objects.get(pk=pk, clinic=request.user.clinic)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        new_password  = request.data.get("new_password", "")
        new_password2 = request.data.get("new_password2", "")

        if not new_password or len(new_password) < 8:
            return Response({"new_password": "Le mot de passe doit contenir au moins 8 caractères."}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != new_password2:
            return Response({"new_password2": "Les mots de passe ne correspondent pas."}, status=status.HTTP_400_BAD_REQUEST)

        target.set_password(new_password)
        target.save()
        return Response({"detail": f"Mot de passe de {target.get_full_name()} réinitialisé avec succès."})


# ---------------------------------------------------------------------------
# Utilisateurs (scoped à la clinique du user connecté)
# ---------------------------------------------------------------------------

class UserListCreateView(generics.ListCreateAPIView):
    """GET /api/users/   POST /api/users/
    ?soignant=1  → uniquement les rôles habilités aux soins (exclut admin/secrétariat)
    """
    permission_classes = [IsAdminOrSuperuser]

    # Groupes purement administratifs — exclus du filtre soignant
    GROUPES_ADMIN = {'ADMIN', 'DIRECTION', 'SUPERVISEUR', 'SECRETAIRE', 'CAISSIER', 'GUEST'}

    def get_queryset(self):
        qs = User.objects.filter(clinic=self.request.user.clinic)
        if self.request.query_params.get('soignant') == '1':
            qs = qs.exclude(group__in=self.GROUPES_ADMIN)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        serializer.save(clinic=self.request.user.clinic)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/users/<id>/"""
    permission_classes = [IsSelfOrAdmin]

    def get_queryset(self):
        return User.objects.filter(clinic=self.request.user.clinic)

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserSerializer


class ClinicUpdateView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/clinic/  — met à jour les infos de la clinique du user connecté."""
    permission_classes = [IsAdminOrSuperuser]
    serializer_class = ClinicSerializer

    def get_object(self):
        return self.request.user.clinic


# ---------------------------------------------------------------------------
# Super Admin — accès global toutes cliniques
# ---------------------------------------------------------------------------

class SuperAdminClinicListView(generics.ListAPIView):
    """GET /api/superadmin/clinics/  — liste toutes les cliniques avec stats."""
    permission_classes = [IsSuperuser]
    serializer_class   = ClinicSerializer

    def get_queryset(self):
        return Clinic.objects.annotate(
            users_count=Count('users', distinct=True),
        ).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        data = []
        for clinic in qs:
            c = ClinicSerializer(clinic).data
            c['users_count'] = clinic.users_count
            # Compter les patients liés à la clinique
            try:
                from patients.models import Patient
                c['patients_count'] = Patient.objects.filter(clinic=clinic).count()
            except Exception:
                c['patients_count'] = 0
            data.append(c)
        return Response(data)


class SuperAdminClinicDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/superadmin/clinics/<pk>/"""
    permission_classes = [IsSuperuser]
    serializer_class   = ClinicSerializer
    queryset           = Clinic.objects.all()


class SuperAdminSubscriptionView(APIView):
    """
    POST /api/superadmin/clinics/<pk>/subscription/
    Gère l'abonnement d'une clinique :
    - Activer / désactiver l'abonnement
    - Changer de plan
    - Prolonger le trial
    Body: { action: "activate"|"deactivate"|"extend_trial", plan?: str, days?: int }
    """
    permission_classes = [IsSuperuser]

    def post(self, request, pk):
        try:
            clinic = Clinic.objects.get(pk=pk)
        except Clinic.DoesNotExist:
            return Response({'detail': 'Clinique introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')

        if action == 'activate':
            plan = request.data.get('plan', 'pro')
            clinic.is_subscribed   = True
            clinic.subscribed_plan = plan
            clinic.trial_ends_at   = None
            clinic.save(update_fields=['is_subscribed', 'subscribed_plan', 'trial_ends_at'])
            return Response({'detail': f'Abonnement activé — plan {plan}.', 'clinic': ClinicSerializer(clinic).data})

        if action == 'deactivate':
            clinic.is_subscribed   = False
            clinic.subscribed_plan = ''
            clinic.save(update_fields=['is_subscribed', 'subscribed_plan'])
            return Response({'detail': 'Abonnement désactivé.', 'clinic': ClinicSerializer(clinic).data})

        if action == 'extend_trial':
            days = int(request.data.get('days', 30))
            import datetime
            base = max(clinic.trial_ends_at or datetime.date.today(), datetime.date.today())
            clinic.trial_ends_at = base + datetime.timedelta(days=days)
            clinic.save(update_fields=['trial_ends_at'])
            return Response({'detail': f'Trial prolongé de {days} jours.', 'clinic': ClinicSerializer(clinic).data})

        return Response({'detail': 'Action invalide. Utilisez activate, deactivate ou extend_trial.'}, status=status.HTTP_400_BAD_REQUEST)


class SuperAdminClinicUsersView(generics.ListAPIView):
    """GET /api/superadmin/clinics/<pk>/users/"""
    permission_classes = [IsSuperuser]
    serializer_class   = UserSerializer

    def get_queryset(self):
        return User.objects.filter(clinic_id=self.kwargs['pk'])


class SuperAdminImpersonateView(APIView):
    """
    POST /api/superadmin/impersonate/
    Body: { "clinic_id": <int> }
    Retourne des tokens JWT pour le premier ADMIN de la clinique cible.
    """
    permission_classes = [IsSuperuser]

    def post(self, request):
        clinic_id = request.data.get('clinic_id')
        if not clinic_id:
            return Response({'detail': 'clinic_id requis.'}, status=status.HTTP_400_BAD_REQUEST)

        # Chercher un admin de la clinique, sinon n'importe quel user actif
        user = (
            User.objects.filter(clinic_id=clinic_id, group='ADMIN', is_active=True).first()
            or User.objects.filter(clinic_id=clinic_id, is_active=True).first()
        )
        if not user:
            return Response({'detail': 'Aucun utilisateur actif dans cette clinique.'}, status=status.HTTP_404_NOT_FOUND)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


# ---------------------------------------------------------------------------
# Stats dashboard — agrégations réelles par mois / semaine
# ---------------------------------------------------------------------------

class StatsView(APIView):
    """
    GET /api/stats/
    Retourne les totaux et l'évolution mensuelle/hebdomadaire pour la clinique.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from patients.models        import Patient
        from consultations.models   import Consultation
        from rendez_vous.models     import RendezVous
        from soins.models           import Soin
        from factures.models        import Facture
        from ordonnances.models     import Ordonnance

        clinic = request.user.clinic

        # ── Paramètres de filtrage ───────────────────────────────────────────
        now        = datetime.datetime.now()
        now_year   = now.year
        now_month  = now.month
        try:
            year = int(request.query_params.get('annee', now_year))
        except (ValueError, TypeError):
            year = now_year
        try:
            periode = max(1, min(90, int(request.query_params.get('periode', 7))))
        except (ValueError, TypeError):
            periode = 7

        # ── Totaux ──────────────────────────────────────────────────────────
        totals = {
            'patients':       Patient.objects.filter(clinic=clinic).count(),
            'consultations':  Consultation.objects.filter(clinic=clinic).count(),
            'rdv':            RendezVous.objects.filter(clinic=clinic).count(),
            'soins':          Soin.objects.filter(clinic=clinic).count(),
            'factures':       Facture.objects.filter(clinic=clinic).count(),
            'ordonnances':    Ordonnance.objects.filter(clinic=clinic).count(),
        }

        MONTH_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
        # Pour une année passée, afficher les 12 mois ; pour l'année en cours, jusqu'au mois actuel
        max_month = 12 if year < now_year else now_month

        def monthly_counts(qs, date_field='created_at'):
            rows = (
                qs.filter(**{f'{date_field}__year': year})
                  .annotate(mois=ExtractMonth(date_field))
                  .values('mois')
                  .annotate(n=Count('id'))
                  .order_by('mois')
            )
            result = {r['mois']: r['n'] for r in rows}
            return [
                {'mois': MONTH_LABELS[m - 1], 'valeur': result.get(m, 0)}
                for m in range(1, max_month + 1)
            ]

        def monthly_multi(qs_map, date_field='created_at'):
            combined = {m: {} for m in range(1, max_month + 1)}
            for key, qs in qs_map.items():
                rows = (
                    qs.filter(**{f'{date_field}__year': year})
                      .annotate(mois=ExtractMonth(date_field))
                      .values('mois')
                      .annotate(n=Count('id'))
                      .order_by('mois')
                )
                counts = {r['mois']: r['n'] for r in rows}
                for m in range(1, max_month + 1):
                    combined[m][key] = counts.get(m, 0)
            return [
                {'mois': MONTH_LABELS[m - 1], **combined[m]}
                for m in range(1, max_month + 1)
            ]

        # ── Données mensuelles ───────────────────────────────────────────────
        monthly_patients = monthly_counts(
            Patient.objects.filter(clinic=clinic)
        )
        monthly_consults = monthly_counts(
            Consultation.objects.filter(clinic=clinic)
        )
        monthly_compare = monthly_multi({
            'patients':      Patient.objects.filter(clinic=clinic),
            'consultations': Consultation.objects.filter(clinic=clinic),
        })

        # ── Activité récente (période configurable) ──────────────────────────
        today = datetime.date.today()
        DAY_LABELS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

        def weekly_counts(qs, date_field='created_at'):
            start = today - datetime.timedelta(days=periode - 1)
            counts: dict = {}
            for obj in qs.filter(**{f'{date_field}__date__gte': start}):
                val = getattr(obj, date_field)
                day = val.date() if hasattr(val, 'date') else val
                counts[day] = counts.get(day, 0) + 1
            return [
                {'jour': DAY_LABELS[(start + datetime.timedelta(days=i)).weekday()],
                 'date': str(start + datetime.timedelta(days=i)),
                 'valeur': counts.get(start + datetime.timedelta(days=i), 0)}
                for i in range(periode)
            ]

        weekly_patients = weekly_counts(Patient.objects.filter(clinic=clinic))

        # ── Répartition pie ──────────────────────────────────────────────────
        pie = [
            {'name': 'Patients',       'value': totals['patients']},
            {'name': 'Consultations',  'value': totals['consultations']},
            {'name': 'Rdv',            'value': totals['rdv']},
            {'name': 'Soins',          'value': totals['soins']},
            {'name': 'Factures',       'value': totals['factures']},
            {'name': 'Ordonnances',    'value': totals['ordonnances']},
        ]

        return Response({
            'totals':            totals,
            'monthly_patients':  monthly_patients,
            'monthly_consults':  monthly_consults,
            'monthly_compare':   monthly_compare,
            'weekly_patients':   weekly_patients,
            'pie':               pie,
        })
