# 📚 Sistema de Mentoría por Estrategias - Documentación

## 🎯 Resumen del Cambio

Hemos migrado el sistema de mentoría de **nivel empresa** a **nivel estrategia**, permitiendo que cada estrategia individual pueda solicitar mentoría especializada.

## 🔄 Diferencias Clave

### ❌ Antes (Sistema Antiguo)

- La **empresa completa** solicitaba mentoría
- Un mentor para toda la empresa
- Sin especialización específica

### ✅ Ahora (Sistema Nuevo)

- Cada **estrategia individual** puede solicitar mentoría
- Mentores especializados por área de expertise
- Múltiples mentores por empresa (uno por estrategia)

## 🏗️ Arquitectura del Sistema

### Modelos Modificados

#### `Estrategia` (nuevos campos):

```python
solicita_mentoria = models.BooleanField(default=False)
especialidad_requerida = models.CharField(max_length=100, null=True, blank=True)
mentor_asignado = models.ForeignKey('users.Usuario', ...)
fecha_solicitud_mentoria = models.DateTimeField(null=True, blank=True)
fecha_asignacion_mentor = models.DateTimeField(null=True, blank=True)
```

#### `Usuario` (nuevo campo):

```python
especialidades = models.CharField(max_length=50, choices=ESPECIALIDADES_CHOICES, ...)
```

#### `Empresa` (campo removido):

```python
# ❌ REMOVIDO: solicita_mentoria = models.BooleanField(default=False)
```

### Especialidades Disponibles

```python
ESPECIALIDADES_CHOICES = [
    ('marketing', 'Marketing Digital'),
    ('finanzas', 'Finanzas y Contabilidad'),
    ('recursos_humanos', 'Recursos Humanos'),
    ('operaciones', 'Operaciones y Logística'),
    ('tecnologia', 'Tecnología e Innovación'),
    ('ventas', 'Ventas y Comercialización'),
    ('legal', 'Legal y Compliance'),
    ('estrategia', 'Estrategia Empresarial'),
    ('liderazgo', 'Liderazgo y Gestión'),
    ('internacional', 'Comercio Internacional'),
]
```

## 🛠️ APIs Implementadas

### Para Empresas

#### 1. Solicitar Mentoría para Estrategia

```http
POST /empresas/api/solicitar-mentoria-estrategia/
Content-Type: application/json

{
    "estrategia_id": 123,
    "especialidad_requerida": "marketing"
}
```

**Respuesta exitosa:**

```json
{
  "mensaje": "Solicitud de mentoría enviada correctamente para la estrategia.",
  "estrategia": "Expansión Digital 2025",
  "especialidad": "marketing"
}
```

#### 2. Cancelar Solicitud de Mentoría

```http
DELETE /empresas/api/solicitar-mentoria-estrategia/
Content-Type: application/json

{
    "estrategia_id": 123
}
```

### Para Mentores

#### 1. Ver Estrategias que Solicitan Mentoría

```http
GET /mentor/api/estrategias-solicitan/
```

**Respuesta:**

```json
{
  "estrategias": [
    {
      "id": 123,
      "titulo": "Expansión Digital 2025",
      "descripcion": "Necesitamos ayuda para...",
      "especialidad_requerida": "marketing",
      "fecha_solicitud": "2025-06-28T10:30:00Z",
      "empresa": {
        "id": 45,
        "razon_social": "Tech Solutions SAC",
        "ruc": "20123456789"
      },
      "usuario_solicitante": {
        "nombre": "Juan Pérez",
        "correo": "juan@techsolutions.com"
      }
    }
  ],
  "total": 1,
  "especialidad_mentor": "marketing"
}
```

#### 2. Aceptar Mentoría de Estrategia

```http
POST /mentor/api/estrategias/{id}/aceptar_mentoria/
```

## 🎨 Frontend Implementation

### JavaScript Principales

#### `mentoria_estrategias.js`

- Modal para solicitar mentoría
- Gestión de estados de estrategias
- Integración con APIs
- Sistema de notificaciones

#### Funciones Clave:

```javascript
// Para empresas
mostrarModalSolicitarMentoria(estrategiaId);
cancelarSolicitudMentoria(estrategiaId);

// Para mentores
cargarEstrategiasSolicitanMentoria();
aceptarMentoriaEstrategia(estrategiaId);
```

### CSS Styles

#### `mentoria_estrategias.css`

- Estados visuales de mentoría
- Modales responsivos
- Badges de especialidades
- Animaciones de transición

## 🔧 Configuración e Instalación

### 1. Migraciones

```bash
# Activar entorno virtual
venv\Scripts\activate

# Aplicar migraciones
python manage.py migrate
```

### 2. Configurar Especialidades de Mentores

Via Django Admin:

1. Ir a `/admin/`
2. Usuarios → Seleccionar mentores
3. Asignar especialidades correspondientes

### 3. Integrar Frontend

```html
<!-- En templates que usen el sistema -->
{% load static %}
<link rel="stylesheet" href="{% static 'css/mentoria_estrategias.css' %}" />
<script src="{% static 'js/mentoria_estrategias.js' %}"></script>
```

## 🚀 Flujo de Uso

### Para Empresas:

1. **Crear estrategia** desde el dashboard
2. **Solicitar mentoría** especificando especialidad requerida
3. **Esperar asignación** de mentor especializado
4. **Colaborar** con mentor asignado via chat/reuniones

### Para Mentores:

1. **Configurar especialidad** en perfil
2. **Ver solicitudes** filtradas por especialidad
3. **Revisar detalles** de estrategia y empresa
4. **Aceptar mentoría** de estrategias de interés
5. **Gestionar múltiples** empresas asesoradas

## 🔍 Testing

### Script de Prueba

```bash
python test_mentoria_sistema.py
```

Este script verifica:

- ✅ Modelos tienen campos correctos
- ✅ Migraciones aplicadas correctamente
- ✅ Datos existentes intactos
- ✅ Especialidades funcionando

## 📊 Beneficios del Nuevo Sistema

### Para Empresas:

- 🎯 **Mentoría específica** por área de necesidad
- 🚀 **Múltiples expertos** colaborando simultáneamente
- ⚡ **Ayuda puntual** para estrategias críticas
- 📈 **Mejor ROI** en consultoría especializada

### Para Mentores:

- 🔥 **Especialización** en áreas de expertise
- 📋 **Gestión eficiente** de tiempo y conocimiento
- 💼 **Múltiples clientes** sin sobrecarga
- 🎯 **Impacto directo** en estrategias específicas

### Para la Plataforma:

- 📈 **Mayor engagement** mentor-empresa
- 🔄 **Escalabilidad** del sistema de mentoría
- 📊 **Mejor tracking** de resultados por estrategia
- 💰 **Nuevas oportunidades** de monetización

## 🚨 Consideraciones Importantes

### Compatibilidad

- ✅ **APIs antiguas deshabilitadas** gradualmente
- ✅ **Datos existentes preservados**
- ✅ **Migración automática** sin pérdida de información

### Seguridad

- 🔐 **Verificación de permisos** por usuario y empresa
- 🛡️ **Validación de especialidades**
- 🔍 **Auditoría completa** de asignaciones

### Performance

- ⚡ **Queries optimizadas** con select_related
- 📋 **Filtrado eficiente** por especialidad
- 🚀 **Carga lazy** de datos no críticos

## 📱 Próximas Mejoras Sugeridas

1. **Sistema de calificaciones** mentor-estrategia
2. **Notificaciones email/SMS** para solicitudes
3. **Dashboard analítico** para métricas de mentoría
4. **Chat integrado** mentor-empresa
5. **Sistema de pagos** por mentoría especializada
6. **Certificaciones** de mentores por especialidad
7. **Matching automático** mentor-estrategia con IA

---

💡 **¿Necesitas ayuda?** Consulta el código en los archivos modificados o ejecuta el script de prueba.
