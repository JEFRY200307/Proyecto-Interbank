from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

class DashboardHomeView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard.html"

class DashboardDocumentosView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard_documentos.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'documentos'
        return context
class DashboardChatView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard_chat.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'chat'
        return context
class DashboardPerfilView(LoginRequiredMixin, TemplateView):
    template_name = "perfil/perfil.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'perfil'
        context['active_tab'] = 'perfil'
        return context
class DashboardUsuariosView(LoginRequiredMixin, TemplateView):
    template_name = "perfil/usuarios.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'perfil'
        context['active_tab'] = 'usuarios'
        return context
    
class DashboardConfiguracionView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard_configuracion.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'perfil'
        context['active_tab'] = 'configuracion'
        return context
    
class DashboardNotificacionesView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard_notificaciones.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'perfil'
        context['active_tab'] = 'notificaciones'
        return context

class DashboardIntegracionesView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard_integraciones.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'perfil'
        context['active_tab'] = 'integraciones'
        return context
    
# Recursos
class DashboardRecursosView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard_recursos.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'recursos'
        return context
    
#Reporte
class DashboardReportesView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard_reportes.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'reportes'
        return context
# Estrategias
class DashboardEstrategiasView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard_estrategias.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'estrategias'
        return context
# Firmas
class DashboardFirmasView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard_firmas.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_section'] = 'firmas'
        return context