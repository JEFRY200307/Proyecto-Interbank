from django.contrib import admin
from .models import ChatMessage, ChatCategory

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'category', 'message', 'timestamp')
    search_fields = ('user__username', 'category__name', 'message')
    list_filter = ('category', 'timestamp')
    actions = ['borrar_todas_conversaciones']

    def borrar_todas_conversaciones(self, request, queryset):
        total = ChatMessage.objects.all().delete()
        self.message_user(request, f"Se han eliminado todas las conversaciones ({total[0]} registros).")
    borrar_todas_conversaciones.short_description = "Borrar todas las conversaciones"

@admin.register(ChatCategory)
class ChatCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
