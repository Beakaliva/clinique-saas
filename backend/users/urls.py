from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    UserListCreateView,
    UserDetailView,
)

app_name = "users"

urlpatterns = [
    # ── Inscription SaaS ──────────────────────────────────────────────────
    path("auth/register/",        RegisterView.as_view(),       name="register"),

    # ── Auth ──────────────────────────────────────────────────────────────
    path("auth/login/",           LoginView.as_view(),          name="login"),
    path("auth/logout/",          LogoutView.as_view(),         name="logout"),
    path("auth/token/refresh/",   TokenRefreshView.as_view(),   name="token-refresh"),
    path("auth/me/",              MeView.as_view(),             name="me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),

    # ── Utilisateurs (scoped à la clinique) ───────────────────────────────
    path("users/",                UserListCreateView.as_view(), name="user-list"),
    path("users/<int:pk>/",       UserDetailView.as_view(),     name="user-detail"),
]
