from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth & utilisateurs
    path('api/', include('users.urls', namespace='users')),

    # Modules cliniques
    path('api/patients/',        include('patients.urls',        namespace='patients')),
    path('api/consultations/',   include('consultations.urls',   namespace='consultations')),
    path('api/dossiers/',        include('dossiers.urls',        namespace='dossiers')),
    path('api/rendez-vous/',     include('rendez_vous.urls',     namespace='rendez_vous')),
    path('api/ordonnances/',     include('ordonnances.urls',     namespace='ordonnances')),
    path('api/factures/',        include('factures.urls',        namespace='factures')),
    path('api/soins/',           include('soins.urls',           namespace='soins')),
    path('api/pharmacie/',       include('pharmacie.urls',       namespace='pharmacie')),
    path('api/laboratoire/',     include('laboratoire.urls',     namespace='laboratoire')),
    path('api/radiologie/',      include('radiologie.urls',      namespace='radiologie')),
    path('api/hospitalisations/',include('hospitalisations.urls',namespace='hospitalisations')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
