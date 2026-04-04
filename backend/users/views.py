from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    ClinicSerializer,
    RegisterSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    LoginSerializer,
)
from .permissions import IsAdminOrSuperuser, IsSelfOrAdmin


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
