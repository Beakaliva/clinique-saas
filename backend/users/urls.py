from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    AdminResetPasswordView,
    UserListCreateView,
    UserDetailView,
    ClinicUpdateView,
    SuperAdminClinicListView,
    SuperAdminClinicDetailView,
    SuperAdminClinicUsersView,
    SuperAdminImpersonateView,
    SuperAdminSubscriptionView,
    StatsView,
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
    path("users/",                         UserListCreateView.as_view(),    name="user-list"),
    path("users/<int:pk>/",                UserDetailView.as_view(),         name="user-detail"),
    path("users/<int:pk>/reset-password/", AdminResetPasswordView.as_view(), name="user-reset-password"),

    # ── Clinique ──────────────────────────────────────────────────────────
    path("clinic/",               ClinicUpdateView.as_view(),   name="clinic"),

    # ── Stats dashboard ───────────────────────────────────────────────────
    path("stats/",                          StatsView.as_view(),                  name="stats"),

    # ── Super Admin ───────────────────────────────────────────────────────
    path("superadmin/clinics/",            SuperAdminClinicListView.as_view(),   name="sa-clinic-list"),
    path("superadmin/clinics/<int:pk>/",   SuperAdminClinicDetailView.as_view(), name="sa-clinic-detail"),
    path("superadmin/clinics/<int:pk>/users/",        SuperAdminClinicUsersView.as_view(),    name="sa-clinic-users"),
    path("superadmin/clinics/<int:pk>/subscription/", SuperAdminSubscriptionView.as_view(),  name="sa-subscription"),
    path("superadmin/impersonate/",                   SuperAdminImpersonateView.as_view(),    name="sa-impersonate"),
]
