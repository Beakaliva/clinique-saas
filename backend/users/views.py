from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
import datetime

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


# ---------------------------------------------------------------------------
# Utilisateurs (scoped à la clinique du user connecté)
# ---------------------------------------------------------------------------

class UserListCreateView(generics.ListCreateAPIView):
    """GET /api/users/   POST /api/users/"""
    permission_classes = [IsAdminOrSuperuser]

    def get_queryset(self):
        return User.objects.filter(clinic=self.request.user.clinic)

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

        # ── Totaux ──────────────────────────────────────────────────────────
        totals = {
            'patients':       Patient.objects.filter(clinic=clinic).count(),
            'consultations':  Consultation.objects.filter(clinic=clinic).count(),
            'rdv':            RendezVous.objects.filter(clinic=clinic).count(),
            'soins':          Soin.objects.filter(clinic=clinic).count(),
            'factures':       Facture.objects.filter(clinic=clinic).count(),
            'ordonnances':    Ordonnance.objects.filter(clinic=clinic).count(),
        }

        year = timezone.now().year
        MONTH_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

        def monthly_counts(qs, date_field='created_at'):
            rows = (
                qs.filter(**{f'{date_field}__year': year})
                  .annotate(mois=TruncMonth(date_field))
                  .values('mois')
                  .annotate(n=Count('id'))
                  .order_by('mois')
            )
            result = {r['mois'].month: r['n'] for r in rows}
            current_month = timezone.now().month
            return [
                {'mois': MONTH_LABELS[m - 1], 'valeur': result.get(m, 0)}
                for m in range(1, current_month + 1)
            ]

        def monthly_multi(qs_map, date_field='created_at'):
            """Retourne [{mois, key1, key2, ...}] pour plusieurs querysets."""
            current_month = timezone.now().month
            combined = {m: {} for m in range(1, current_month + 1)}
            for key, qs in qs_map.items():
                rows = (
                    qs.filter(**{f'{date_field}__year': year})
                      .annotate(mois=TruncMonth(date_field))
                      .values('mois')
                      .annotate(n=Count('id'))
                      .order_by('mois')
                )
                counts = {r['mois'].month: r['n'] for r in rows}
                for m in range(1, current_month + 1):
                    combined[m][key] = counts.get(m, 0)
            return [
                {'mois': MONTH_LABELS[m - 1], **combined[m]}
                for m in range(1, current_month + 1)
            ]

        # ── Données mensuelles ───────────────────────────────────────────────
        monthly_patients = monthly_counts(
            Patient.objects.filter(clinic=clinic)
        )
        monthly_consults = monthly_counts(
            Consultation.objects.filter(clinic=clinic)
        )
        monthly_compare = monthly_multi({
            'patients':     Patient.objects.filter(clinic=clinic),
            'consultations': Consultation.objects.filter(clinic=clinic),
        })

        # ── Activité 7 derniers jours ────────────────────────────────────────
        today = timezone.now().date()
        DAY_LABELS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

        def weekly_counts(qs, date_field='created_at'):
            start = today - datetime.timedelta(days=6)
            rows = (
                qs.filter(**{f'{date_field}__date__gte': start})
                  .annotate(jour=TruncDate(date_field))
                  .values('jour')
                  .annotate(n=Count('id'))
                  .order_by('jour')
            )
            counts = {r['jour']: r['n'] for r in rows}
            result = []
            for i in range(7):
                d = start + datetime.timedelta(days=i)
                result.append({
                    'jour': DAY_LABELS[d.weekday()],
                    'valeur': counts.get(d, 0),
                })
            return result

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
