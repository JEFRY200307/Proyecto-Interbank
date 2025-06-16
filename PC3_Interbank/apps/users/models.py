from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.contrib.auth.hashers import make_password, check_password


class UsuarioManager(BaseUserManager):
    def create_user(self, correo, password=None, **extra_fields):
        if not correo:
            raise ValueError('El usuario debe tener un correo electrónico')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, password=None, **extra_fields):
        extra_fields.setdefault('rol', 'superadmin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(correo, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE, related_name='usuarios', null=True, blank=True)
    nombre = models.CharField(max_length=255)
    dni = models.CharField(max_length=8, unique=True, blank=True, null=True)
    correo = models.EmailField(unique=True)
    rol = models.CharField(
        max_length=20,
        choices=[
            ('empresa', 'Administrador Empresa'),
            ('mentor', 'Mentor'),
            ('superadmin', 'Superadmin'),
            ('editor', 'Editor'),
            ('lector', 'Lector'),
        ]
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    clave_firma = models.CharField(max_length=128, blank=True, null=True)  # hash del PIN

    def set_clave_firma(self, raw_pin):
        self.clave_firma = make_password(raw_pin)
        self.save(update_fields=['clave_firma'])

    def check_clave_firma(self, raw_pin):
        return check_password(raw_pin, self.clave_firma)

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = []

    objects = UsuarioManager()

    def __str__(self):
        return self.nombre or self.correo