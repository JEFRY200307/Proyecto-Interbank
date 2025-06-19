from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

class DashboardMentorView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard_mentor.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Datos de prueba para empresas
        context['empresas'] = [
            {'id': 1, 'razon_social': 'Empresa Alpha', 'ruc': '12345678901', 'correo': 'alpha@correo.com', 'estado': 'Activo'},
            {'id': 2, 'razon_social': 'Empresa Beta', 'ruc': '10987654321', 'correo': 'beta@correo.com', 'estado': 'Inactivo'},
        ]
        return context
