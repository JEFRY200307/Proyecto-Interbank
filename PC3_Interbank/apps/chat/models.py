# apps/chat/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class ChatMessage(models.Model):
    category = models.ForeignKey(ChatCategory, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.category}: {self.message[:20]}"
