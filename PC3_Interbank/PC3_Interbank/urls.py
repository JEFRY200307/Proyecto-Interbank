from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from apps.dashboard.views import DashboardEstrategiasView

urlpatterns = [
    path('', include('apps.empresas.urls')),  # <-- según tu estructura
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/', admin.site.urls),
    path('users/dashboard/chat/', include('apps.chat.urls')),
    path('users/', include('apps.chat.urls')),
    path('users/', include('apps.users.urls')),
    path('mentor/', include('apps.mentor.urls')),
    path('dashboard/', include('apps.dashboard.urls')),
    path('empresas/', include('apps.empresas.urls')),
    path('documentos/', include('apps.documentos.urls')),
    path('chat/', include('apps.chat.urls')),  # Nueva ruta para acceso directo a chat APIs
    path('users/dashboard/estrategias/', DashboardEstrategiasView.as_view(), name='dashboard_estrategias'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # La línea de arriba es para MEDIA_ROOT, la de abajo es la que necesitas para STATIC
    urlpatterns += static(settings.STATIC_URL, document_root=settings.BASE_DIR / 'static')