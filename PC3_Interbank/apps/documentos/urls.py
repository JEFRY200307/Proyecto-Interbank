from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentoViewSet, FirmaViewSet
from .views import (
    DocumentoEmpresaAPIView, 
    GenerarPDFAPIView,
    DocumentoDetailAPIView,
    PendientesFirmaAPIView,
    FirmarDocumentoAPIView,
    FirmaDetailAPIView,
    HistorialFirmasAPIView,
    dashboard_firmas,
    dashboard_documentos,
    AsignarFirmantesAPIView
)
router = DefaultRouter()
router.register(r'documentos', DocumentoViewSet, basename='documento')
router.register(r'firmas', FirmaViewSet, basename='firma')


urlpatterns = [
     # Dashboards
    path('dashboard/documentos/', dashboard_documentos, name='dashboard_documentos'),
    path('dashboard/firmas/', dashboard_firmas, name='dashboard_firmas'),

    # API Endpoints
    path('empresa/', DocumentoEmpresaAPIView.as_view(), name='documentos_empresa_api'),
    path('empresa/<int:pk>/', DocumentoDetailAPIView.as_view(), name='documento_detalle_api'),
    path('empresa/<int:documento_id>/firmantes/', AsignarFirmantesAPIView.as_view(), name='asignar_firmantes'),
    path('generar-pdf/<int:pk>/', GenerarPDFAPIView.as_view(), name='generar_pdf_api'),
    
    path('firmas/pendientes/', PendientesFirmaAPIView.as_view(), name='firmas_pendientes'),
    path('documentos/firmas/historial/', HistorialFirmasAPIView.as_view()),
    path('firmas/<int:pk>/firmar/', FirmarDocumentoAPIView.as_view(), name='firmar_documento'),
    path('firmas/<int:pk>/', FirmaDetailAPIView.as_view()),
    # apps/documentos/urls.py
    path('firmas/historial/', HistorialFirmasAPIView.as_view(), name='firmas_historial'),

    # CRUD de documentos y firmas (RESTful)
    path('api/', include(router.urls)),

   
]