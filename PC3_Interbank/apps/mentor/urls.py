from django.urls import path
from .views import (
    DashboardMentorView,
    # ...otros
)

urlpatterns = [
    path('dashboard/', DashboardMentorView.as_view(), name='dashboard_mentor'),
]