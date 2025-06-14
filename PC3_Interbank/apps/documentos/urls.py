from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentoViewSet, FirmaViewSet, firmar_documento
from .views import (
    DocumentoEmpresaAPIView, 
    GenerarPDFAPIView,
    DocumentoDetailAPIView,
    dashboard_firmas,
    dashboard_documentos,
    gestionar_firmas, 
    auditoria_firmas,
    api_firmas,
    asignar_firmantes
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
    path('generar-pdf/<int:pk>/', GenerarPDFAPIView.as_view(), name='generar_pdf_api'),
    
    path('api/firmas/', api_firmas, name='api_firmas'),
    path('firmas/<int:documento_id>/', gestionar_firmas, name='gestionar_firmas'),
    path('documentos/<int:documento_id>/asignar/', asignar_firmantes, name='asignar_firmantes'),
    path('firmas/auditoria/<int:documento_id>/', auditoria_firmas, name='auditoria_firmas'),

    # CRUD de documentos y firmas (RESTful)
    path('api/', include(router.urls)),

    # Firmar documento (solo POST)
    path('api/firmar/<int:firma_id>/', firmar_documento, name='firmar_documento'),

   
]