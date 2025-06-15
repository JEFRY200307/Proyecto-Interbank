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
    path('dashboard/', include('apps.dashboard.urls')),
    path('empresas/', include('apps.empresas.urls')),
    path('documentos/', include('apps.documentos.urls')),
    path('users/dashboard/estrategias/', DashboardEstrategiasView.as_view(), name='dashboard_estrategias'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
